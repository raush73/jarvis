import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CommissionPacketRow {
  invoiceNumber: string | null;
  invoiceId: string;
  customerName: string;
  paymentId: string;
  paymentPostedAt: string;
  paymentAmount: string;
  commissionRateApplied: string;
  commissionAmount: string;
  salespersonUserId: string;
  salespersonEmail: string;
  commissionRule: string;
}

@Injectable()
export class CommissionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Phase 28A (per-payment): create CommissionEvent rows for a single InvoicePayment
  async createCommissionEventsForPayment(args: { invoicePaymentId: string }) {
    const { invoicePaymentId } = args;
    if (!invoicePaymentId) throw new BadRequestException('invoicePaymentId is required');

    const payment = await this.prisma.invoicePayment.findUnique({
      where: { id: invoicePaymentId },
      select: {
        id: true,
        amount: true,
        paymentReceivedAt: true,
        paymentPostedAt: true,
        invoice: {
          select: {
            id: true,
            customerId: true,
            orderId: true,
            issuedAt: true,
            invoiceDate: true,
            totalAmountCents: true,
            tradeMarginSnapshot: {
              select: {
                tradeRevenuePaid: true,
                tradeMargin: true,
                commissionRateSnapshot: true,
                bankLagDaysSnapshot: true,
                postingGraceDaysSnapshot: true,
              },
            },
            order: {
              select: {
                commissionAssignments: {
                  select: {
                    id: true,
                    userId: true,
                    splitPercent: true,
                    effectiveFrom: true,
                    effectiveTo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) throw new BadRequestException('InvoicePayment not found');

    const invoice = payment.invoice;
    if (!invoice) throw new BadRequestException('Payment must belong to an invoice');

    const earnedAt = payment.paymentReceivedAt;
    const postedAt = payment.paymentPostedAt;

    const baseDate = invoice.issuedAt ?? invoice.invoiceDate ?? earnedAt;
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysToPaid = Math.max(0, Math.floor((earnedAt.getTime() - baseDate.getTime()) / msPerDay));

    // Tier multiplier: prefer active CommissionPlan tiers; fallback to LOCKED defaults
    let payoutMultiplierSnapshot = 1;

    const activePlan = await this.prisma.commissionPlan.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        defaultRate: true,
        tiers: { select: { minDays: true, maxDays: true, multiplier: true } },
      },
    });

    const tiers = activePlan?.tiers ?? [];
    const tier =
      tiers.find(t => daysToPaid >= t.minDays && (t.maxDays === null || t.maxDays === undefined || daysToPaid <= t.maxDays)) ??
      null;

    if (tier) {
      payoutMultiplierSnapshot = tier.multiplier;
    } else {
      // LOCKED fallback:
      // <45: 1.0, 46-59: .75, 60-89: .50, 90+: 0
      if (daysToPaid <= 45) payoutMultiplierSnapshot = 1.0;
      else if (daysToPaid <= 59) payoutMultiplierSnapshot = 0.75;
      else if (daysToPaid <= 89) payoutMultiplierSnapshot = 0.5;
      else payoutMultiplierSnapshot = 0.0;
    }

    const commissionRateSnapshot =
      invoice.tradeMarginSnapshot?.commissionRateSnapshot ??
      activePlan?.defaultRate ??
      0.10;

    const bankLagDays = invoice.tradeMarginSnapshot?.bankLagDaysSnapshot ?? 1;
    const graceDays = invoice.tradeMarginSnapshot?.postingGraceDaysSnapshot ?? 1;
    const allowedPostedAt = new Date(earnedAt.getTime() + (bankLagDays + graceDays) * msPerDay);
    const isLatePosted = postedAt.getTime() > allowedPostedAt.getTime();

    // Commission base = TRUE MARGIN with proportional scaling for partial payments
    // FIN-COMM-GP-01: proportion based on paid-to-date with tolerance
    const COMMISSION_CLOSE_TOLERANCE_DOLLARS = 100;

    const invoiceTotalDollars = invoice.totalAmountCents / 100;
    const fullMargin = invoice.tradeMarginSnapshot?.tradeMargin ?? 0;
    const fullRevenue = invoice.tradeMarginSnapshot?.tradeRevenuePaid ?? invoiceTotalDollars;

    // Fetch all payments for this invoice to compute paid-to-date
    const allPayments = await this.prisma.invoicePayment.findMany({
      where: { invoiceId: invoice.id },
      select: { id: true, amount: true },
    });

    const paidToDate = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const paidBeforeThisPayment = allPayments
      .filter((p) => p.id !== payment.id)
      .reduce((sum, p) => sum + p.amount, 0);

    // Compute effective paid values (clamped to invoice total)
    const effectivePaidBefore = Math.min(paidBeforeThisPayment, invoiceTotalDollars);
    const remainingAfter = invoiceTotalDollars - paidToDate;

    let effectivePaidToDate = Math.min(paidToDate, invoiceTotalDollars);

    // Apply tolerance: if remaining is within tolerance (and not overpaid), treat as closed
    if (remainingAfter >= 0 && remainingAfter <= COMMISSION_CLOSE_TOLERANCE_DOLLARS) {
      effectivePaidToDate = invoiceTotalDollars;
    }

    // Ensure effectivePaidToDate is never less than effectivePaidBefore
    if (effectivePaidToDate < effectivePaidBefore) {
      effectivePaidToDate = effectivePaidBefore;
    }

    const effectiveAmountThisPayment = effectivePaidToDate - effectivePaidBefore;

    // Proportional scaling: uses effective amount for tolerance handling
    const proportion = invoiceTotalDollars > 0 ? effectiveAmountThisPayment / invoiceTotalDollars : 0;
    const marginPaid = fullMargin * proportion;
    const revenuePaid = fullRevenue * proportion;

    const assignments = invoice.order?.commissionAssignments ?? [];
    const eligible = assignments.filter(a => {
      if (a.effectiveFrom && earnedAt.getTime() < a.effectiveFrom.getTime()) return false;
      if (a.effectiveTo && earnedAt.getTime() > a.effectiveTo.getTime()) return false;
      return true;
    });

    if (eligible.length === 0) return { ok: true, created: 0, events: [] };

    const createdEvents: any[] = [];
    for (const a of eligible) {
      const split = a.splitPercent ?? 1;
      const rawCommissionAmount = marginPaid * commissionRateSnapshot * split;
      const payableCommissionAmount = rawCommissionAmount * payoutMultiplierSnapshot;

      const ev = await this.prisma.commissionEvent.upsert({
        where: {
          invoicePaymentId_commissionAssignmentId: {
            invoicePaymentId: payment.id,
            commissionAssignmentId: a.id,
          },
        },
        update: {},
        create: {
          invoicePaymentId: payment.id,
          commissionAssignmentId: a.id,
          userId: a.userId,
          earnedAt,
          postedAt,
          daysToPaid,
          commissionRateSnapshot,
          payoutMultiplierSnapshot,
          rawCommissionAmount,
          payableCommissionAmount,
          isLatePosted,
        },
      });

      createdEvents.push(ev);
    }

    return { ok: true, created: createdEvents.length, revenuePaid, marginPaid, events: createdEvents };
  }

  /**
   * Generate commission packet data for a date range (by postedAt).
   * Returns rows ready for CSV export.
   */
  async getCommissionPacketData(args: {
    startDate: Date;
    endDate: Date;
  }): Promise<CommissionPacketRow[]> {
    const { startDate, endDate } = args;

    // Query commission events in the posting window
    const events = await this.prisma.commissionEvent.findMany({
      where: {
        postedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        invoicePayment: {
          include: {
            invoice: {
              include: {
                customer: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        assignment: {
          select: {
            splitPercent: true,
          },
        },
      },
      orderBy: [{ postedAt: 'asc' }, { createdAt: 'asc' }],
    });

    const rows: CommissionPacketRow[] = events.map((ev) => {
      const payment = ev.invoicePayment;
      const invoice = payment.invoice;

      // Derive commission rule from payout multiplier
      let commissionRule = 'default';
      if (ev.payoutMultiplierSnapshot === 1.0) commissionRule = 'tier-0-40';
      else if (ev.payoutMultiplierSnapshot === 0.75) commissionRule = 'tier-41-59';
      else if (ev.payoutMultiplierSnapshot === 0.5) commissionRule = 'tier-60-89';
      else if (ev.payoutMultiplierSnapshot === 0.0) commissionRule = 'tier-90+';
      if (ev.isLatePosted) commissionRule += '/late-posted';

      return {
        invoiceNumber: invoice.invoiceNumber,
        invoiceId: invoice.id,
        customerName: invoice.customer.name,
        paymentId: payment.id,
        paymentPostedAt: ev.postedAt.toISOString(),
        paymentAmount: payment.amount.toFixed(2),
        commissionRateApplied: ev.commissionRateSnapshot.toFixed(4),
        commissionAmount: ev.payableCommissionAmount.toFixed(2),
        salespersonUserId: ev.userId,
        salespersonEmail: ev.user.email,
        commissionRule,
      };
    });

    return rows;
  }

  /**
   * Generate CSV string from commission packet rows.
   */
  generateCsv(rows: CommissionPacketRow[]): string {
    const headers = [
      'invoiceNumber',
      'invoiceId',
      'customerName',
      'paymentId',
      'paymentPostedAt',
      'paymentAmount',
      'commissionRateApplied',
      'commissionAmount',
      'salespersonUserId',
      'salespersonEmail',
      'commissionRule',
    ];

    const escapeField = (val: string | null): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      // Escape double quotes and wrap in quotes if needed
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvLines: string[] = [];
    csvLines.push(headers.join(','));

    for (const row of rows) {
      const values = headers.map((h) => escapeField(row[h as keyof CommissionPacketRow]));
      csvLines.push(values.join(','));
    }

    return csvLines.join('\r\n');
  }
}

