import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalStatus } from '@prisma/client';
import { OrderStatus } from '../orders/order-status';
import { InvoicePaymentsService } from '../invoice-payments/invoice-payments.service';
import { CreateInvoicePaymentInput } from '../invoice-payments/invoice-payments.service';
import { InvoiceApprovalRoutingService } from './invoice-approval-routing.service';
import { SettingsService } from '../settings/settings.service';
import PDFDocument from 'pdfkit';
import type {
  InternalInvoiceViewResponse,
  InternalAdjustmentView,
  PaymentLedgerItem,
  PaymentTotals,
  PaymentStatusBadge,
} from './dto/internal-invoice-view.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoicePaymentsService: InvoicePaymentsService,
    private readonly invoiceApprovalRoutingService: InvoiceApprovalRoutingService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Phase 16: Convert dollars to cents (rounds to 2 decimals)
   * @param dollars Amount in dollars
   * @returns Amount in cents
   */
  private toCents(dollars: number): number {
    return Math.round(dollars * 100);
  }

  /**
   * Phase 16: Compute line item cents values
   * @param amountDollars Unit rate in dollars
   * @param quantity Optional quantity (defaults to 1)
   * @returns Object with unitRateCents and lineTotalCents
   */
  private computeLineItemCents(
    amountDollars: number,
    quantity?: number | null,
  ): { unitRateCents: number; lineTotalCents: number } {
    const qty = quantity ?? 1;
    const unitRateCents = this.toCents(amountDollars);
    const lineTotalCents = this.toCents(amountDollars * qty);
    return { unitRateCents, lineTotalCents };
  }

  /**
   * Phase 13: Create invoice for an order (idempotent)
   *
   * Requirements:
   * - Order must exist
   * - Order status must be FILLED
   * - No PENDING hours
   * - No REJECTED hours
   * - Approved hours sum > 0
   *
   * Returns existing invoice if one already exists for the order.
   */
  async createInvoiceForOrder(orderId: string) {
    // Validate order exists
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        customerId: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Require order.status === FILLED
    if (order.status !== OrderStatus.FILLED) {
      throw new BadRequestException(
        `Cannot create invoice: order status must be FILLED, got ${order.status}`,
      );
    }

    // Check for existing invoice (idempotent)
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: { orderId },
      select: { id: true },
    });

    if (existingInvoice) {
      return this.prisma.invoice.findUnique({
        where: { id: existingInvoice.id },
        include: {
          lineItems: true,
        },
      });
    }

    // Require no PENDING hours
    const pendingHours = await this.prisma.hoursEntry.findFirst({
      where: {
        orderId,
        approvalStatus: 'PENDING',
      },
      select: { id: true },
    });

    if (pendingHours) {
      throw new BadRequestException(
        'Cannot create invoice: hours are pending approval',
      );
    }

    // Require no REJECTED hours
    const rejectedHours = await this.prisma.hoursEntry.findFirst({
      where: {
        orderId,
        approvalStatus: 'REJECTED',
      },
      select: { id: true },
    });

    if (rejectedHours) {
      throw new BadRequestException(
        'Cannot create invoice: rejected hours must be resolved',
      );
    }

    // Require approved hours sum > 0
    const approvedHoursEntries = await this.prisma.hoursEntry.findMany({
      where: {
        orderId,
        approvalStatus: 'APPROVED',
      },
      select: {
        totalHours: true,
      },
    });

    const approvedHoursSum = approvedHoursEntries.reduce(
      (sum, entry) => sum + entry.totalHours,
      0,
    );

    if (approvedHoursSum <= 0) {
      throw new BadRequestException(
        'Cannot create invoice: approved hours sum must be greater than 0',
      );
    }

    // Create invoice in transaction
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          customerId: order.customerId,
          orderId: orderId,
          status: 'DRAFT',
          subtotalAmountCents: 0,
          totalAmountCents: 0,
        },
      });

      // Phase 16: Compute line item cents before creating
      const amountDollars = 0;
      const quantity = approvedHoursSum;
      const { unitRateCents, lineTotalCents } = this.computeLineItemCents(
        amountDollars,
        quantity,
      );

      // Create one InvoiceLineItem for approved hours with cents snapshot
      await tx.invoiceLineItem.create({
        data: {
          invoiceId: invoice.id,
          type: 'TRADE_LABOR',
          description: 'Labor - Approved Hours',
          quantity: approvedHoursSum,
          amount: amountDollars,
          unitRateCents,
          lineTotalCents,
        },
      });

      // Phase 16: Compute invoice totals (sum of all line item totals)
      const allLineItems = await tx.invoiceLineItem.findMany({
        where: { invoiceId: invoice.id },
        select: { lineTotalCents: true },
      });

      const subtotalAmountCents = allLineItems.reduce(
        (sum, item) => sum + (item.lineTotalCents ?? 0),
        0,
      );
      const totalAmountCents = subtotalAmountCents; // total = subtotal for now

      // Update invoice with computed totals
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotalAmountCents,
          totalAmountCents,
        },
      });

      // Return invoice with line items
      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          lineItems: true,
        },
      });
    });
  }

  /**
   * Phase 15 / Invoice Segment: Issue an invoice (legally finalizing operation)
   *
   * Preconditions:
   * - Invoice must exist (404 if not)
   * - Invoice status must be DRAFT (400 if not)
   * - Idempotent: invoiceNumber must be null (no re-issue)
   * - Routing logic must pass
   *
   * Operations (atomic transaction):
   * - Assign consecutive invoiceNumber via InvoiceSequence
   * - Snapshot approved hours + all line items into issuedSnapshotJson
   * - Compute subtotalAmountCents and totalAmountCents
   * - Set issuedAt and issuedByUserId
   * - status → 'ISSUED'
   */
  async issueInvoice(invoiceId: string, issuedByUserId: string) {
    // Evaluate routing BEFORE transaction (reads only)
    const invoiceForRouting = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        status: true,
        invoiceNumber: true,
        approvalStatus: true,
      },
    });

    if (!invoiceForRouting) {
      throw new NotFoundException();
    }

    // Require status === DRAFT
    if (invoiceForRouting.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT invoices can be issued.');
    }

    // Idempotent: reject if already issued (invoiceNumber assigned)
    if (invoiceForRouting.invoiceNumber) {
      throw new BadRequestException('Invoice has already been issued.');
    }

    // Evaluate routing before issuance
    const outcome =
      await this.invoiceApprovalRoutingService.evaluateInvoiceRouting(invoiceId);

    if (outcome.action !== 'PROCEED_ISSUE') {
      // Bypass cutoff block if invoice is already APPROVED
      if (
        outcome.action === 'ROUTE_ADMIN' &&
        outcome.reasons.includes('Missed cutoff') &&
        invoiceForRouting.approvalStatus === ApprovalStatus.APPROVED
      ) {
        // admin/management already approved; allow issuance
      } else {
        // Phase 18+ Option A Step A4:
        // Persist routing outcome when issuance is blocked (internal-only)
        await this.prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            routedToAdminAt: new Date(),
            routingReason: outcome.reasons.join('; '),
          },
        });

        throw new BadRequestException(
          `Invoice cannot be issued: ${outcome.action}. Reasons: ${outcome.reasons.join('; ')}`,
        );
      }
    }

    // Execute issuance in atomic transaction
    return this.prisma.$transaction(async (tx) => {
      // Re-fetch invoice with all related data for snapshot
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          lineItems: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          order: {
            select: {
              id: true,
              status: true,
              customerId: true,
              locationId: true,
            },
          },
        },
      });

      if (!invoice) {
        throw new NotFoundException();
      }

      // Double-check status inside transaction (race condition guard)
      if (invoice.status !== 'DRAFT') {
        throw new BadRequestException('Only DRAFT invoices can be issued.');
      }

      // Fetch approved hours entries for snapshot (if order exists)
      // Include lines relation to capture SD buckets (REG_SD, OT_SD, DT_SD)
      let approvedHoursSnapshot: Array<{
        id: string;
        workerId: string;
        periodStart: string;
        periodEnd: string;
        totalHours: number;
        type: string;
        enteredBy: string;
        lines: Array<{
          earningCode: string;
          unit: string;
          quantity: number;
          rate: number | null;
          amount: number | null;
        }>;
      }> = [];

      if (invoice.orderId) {
        const approvedHours = await tx.hoursEntry.findMany({
          where: {
            orderId: invoice.orderId,
            approvalStatus: 'APPROVED',
          },
          select: {
            id: true,
            workerId: true,
            periodStart: true,
            periodEnd: true,
            totalHours: true,
            type: true,
            enteredBy: true,
            lines: {
              select: {
                earningCode: true,
                unit: true,
                quantity: true,
                rate: true,
                amount: true,
              },
            },
          },
          orderBy: { periodStart: 'asc' },
        });

        // 1:1 carry-forward of HoursEntryLine records (includes SD buckets: REG_SD, OT_SD, DT_SD)
        approvedHoursSnapshot = approvedHours.map((h) => ({
          id: h.id,
          workerId: h.workerId,
          periodStart: h.periodStart.toISOString(),
          periodEnd: h.periodEnd.toISOString(),
          totalHours: h.totalHours,
          type: h.type,
          enteredBy: h.enteredBy,
          lines: h.lines.map((line) => ({
            earningCode: line.earningCode,
            unit: line.unit,
            quantity: line.quantity ? Number(line.quantity) : 0,
            rate: line.rate ? Number(line.rate) : null,
            amount: line.amount ? Number(line.amount) : null,
          })),
        }));
      }

      // ---------------------------------------------------------------
      // SD BILLING: Aggregate SD hours from approvedHoursSnapshot
      // Source: approvedHoursSnapshot[].lines[].unit === REG_SD | OT_SD | DT_SD
      // ---------------------------------------------------------------
      let regSdHours = 0;
      let otSdHours = 0;
      let dtSdHours = 0;

      for (const entry of approvedHoursSnapshot) {
        for (const line of entry.lines) {
          if (line.unit === 'REG_SD') {
            regSdHours += line.quantity;
          } else if (line.unit === 'OT_SD') {
            otSdHours += line.quantity;
          } else if (line.unit === 'DT_SD') {
            dtSdHours += line.quantity;
          }
        }
      }

      const totalSdHours = regSdHours + otSdHours + dtSdHours;

      // Only create SD line items if there are SD hours
      if (totalSdHours > 0 && invoice.orderId) {
        // Fetch sdBillDeltaRate from the Job Order
        const orderWithSdRate = await tx.order.findUnique({
          where: { id: invoice.orderId },
          select: { sdBillDeltaRate: true },
        });

        const sdBillDeltaRate = orderWithSdRate?.sdBillDeltaRate
          ? Number(orderWithSdRate.sdBillDeltaRate)
          : 0;

        // Determine baseRate from existing TRADE_LABOR line item
        // DO NOT infer from HoursEntryLine; use existing invoice labor line
        const laborLineItem = invoice.lineItems.find(
          (li) => li.type === 'TRADE_LABOR',
        );
        const baseRate = laborLineItem?.amount ?? 0;

        // Create SD line items (only if quantity > 0)
        if (regSdHours > 0) {
          const sdRegRate = baseRate + sdBillDeltaRate;
          const { unitRateCents, lineTotalCents } = this.computeLineItemCents(
            sdRegRate,
            regSdHours,
          );
          await tx.invoiceLineItem.create({
            data: {
              invoiceId: invoice.id,
              type: 'TRADE_LABOR',
              description: 'Labor – Shift Differential (REG)',
              quantity: regSdHours,
              amount: sdRegRate,
              unitRateCents,
              lineTotalCents,
            },
          });
        }

        if (otSdHours > 0) {
          const sdOtRate = (baseRate + sdBillDeltaRate) * 1.5;
          const { unitRateCents, lineTotalCents } = this.computeLineItemCents(
            sdOtRate,
            otSdHours,
          );
          await tx.invoiceLineItem.create({
            data: {
              invoiceId: invoice.id,
              type: 'TRADE_LABOR',
              description: 'Labor – Shift Differential (OT)',
              quantity: otSdHours,
              amount: sdOtRate,
              unitRateCents,
              lineTotalCents,
            },
          });
        }

        if (dtSdHours > 0) {
          const sdDtRate = (baseRate + sdBillDeltaRate) * 2.0;
          const { unitRateCents, lineTotalCents } = this.computeLineItemCents(
            sdDtRate,
            dtSdHours,
          );
          await tx.invoiceLineItem.create({
            data: {
              invoiceId: invoice.id,
              type: 'TRADE_LABOR',
              description: 'Labor – Shift Differential (DT)',
              quantity: dtSdHours,
              amount: sdDtRate,
              unitRateCents,
              lineTotalCents,
            },
          });
        }
      }
      // ---------------------------------------------------------------
      // END SD BILLING
      // ---------------------------------------------------------------

      // Re-fetch line items after SD additions for accurate totals
      const allLineItems = await tx.invoiceLineItem.findMany({
        where: { invoiceId: invoice.id },
        select: { lineTotalCents: true },
      });

      // Compute totals from line items (including any new SD lines)
      const subtotalAmountCents = allLineItems.reduce(
        (sum, item) => sum + (item.lineTotalCents ?? 0),
        0,
      );
      const totalAmountCents = subtotalAmountCents; // No tax/adjustments for now

      // Allocate consecutive invoice number atomically
      const sequenceKey = 'default';
      const existingSeq = await tx.invoiceSequence.findUnique({
        where: { key: sequenceKey },
      });

      let invoiceNumberValue: number;
      if (!existingSeq) {
        // Initialize sequence: use 1, set next to 2
        await tx.invoiceSequence.create({
          data: { key: sequenceKey, nextNumber: 2 },
        });
        invoiceNumberValue = 1;
      } else {
        invoiceNumberValue = existingSeq.nextNumber;
        await tx.invoiceSequence.update({
          where: { key: sequenceKey },
          data: { nextNumber: invoiceNumberValue + 1 },
        });
      }

      const invoiceNumber = `INV-${String(invoiceNumberValue).padStart(6, '0')}`;

      // Build immutable snapshot
      const issuedAt = new Date();

      // Snapshot invoice footer text at issue time (immutable)
      const invoiceFooterText = await this.settingsService.getInvoiceFooterText();

      // Re-fetch all line items (including SD lines) for snapshot
      const snapshotLineItems = await tx.invoiceLineItem.findMany({
        where: { invoiceId: invoice.id },
      });

      const issuedSnapshotJson = {
        snapshotVersion: 1,
        invoiceId: invoice.id,
        invoiceNumber,
        issuedAt: issuedAt.toISOString(),
        issuedByUserId,
        customer: {
          id: invoice.customer.id,
          name: invoice.customer.name,
        },
        order: invoice.order
          ? {
              id: invoice.order.id,
              status: invoice.order.status,
              customerId: invoice.order.customerId,
              locationId: invoice.order.locationId,
            }
          : null,
        lineItems: snapshotLineItems.map((li) => ({
          id: li.id,
          type: li.type,
          description: li.description,
          amount: li.amount,
          quantity: li.quantity,
          unitRateCents: li.unitRateCents,
          lineTotalCents: li.lineTotalCents,
          tradeCode: li.tradeCode,
          state: li.state,
          isCommissionable: li.isCommissionable,
        })),
        approvedHoursEntries: approvedHoursSnapshot,
        subtotalAmountCents,
        totalAmountCents,
        invoiceFooterText,
      };

      // Update invoice with all issued fields
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'ISSUED',
          issuedAt,
          issuedByUserId,
          invoiceNumber,
          subtotalAmountCents,
          totalAmountCents,
          issuedSnapshotJson,
        },
        select: {
          id: true,
          invoiceNumber: true,
          orderId: true,
          customerId: true,
          status: true,
          issuedAt: true,
          issuedByUserId: true,
          subtotalAmountCents: true,
          totalAmountCents: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updated;
    });
  }

  /**
   * Phase 17: Compute paid state for an invoice
   * - Convert payment.amount (Float) to cents using half-up rounding
   * - Sum all payments in cents
   * - Compare to invoice.totalAmountCents (Int)
   * @param invoiceId Invoice ID
   * @returns Object with totalPaidCents, balanceCents, and isPaid boolean
   */
  private async computePaidState(invoiceId: string): Promise<{
    totalPaidCents: number;
    balanceCents: number;
    isPaid: boolean;
  }> {
    // Get invoice total
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { totalAmountCents: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Get all payments for this invoice
    const payments = await this.prisma.invoicePayment.findMany({
      where: { invoiceId },
      select: { amount: true },
    });

    // Convert payment amounts to cents using deterministic rounding (half-up)
    const totalPaidCents = payments.reduce((sum, payment) => {
      const paymentCents = Math.round(payment.amount * 100);
      return sum + paymentCents;
    }, 0);

    // Clamp to 0 (never negative per domain invariant)
    const balanceCents = Math.max(0, invoice.totalAmountCents - totalPaidCents);
    const isPaid = totalPaidCents >= invoice.totalAmountCents;

    return {
      totalPaidCents,
      balanceCents,
      isPaid,
    };
  }

  /**
   * Phase 17: Get invoice by ID with derived paid-state fields
   * @param invoiceId Invoice ID
   * @returns Invoice with totalPaidCents, balanceCents, and isPaid
   */
  async getInvoiceById(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        lineItems: true,
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Compute derived paid state
    const paidState = await this.computePaidState(invoiceId);

    return {
      ...invoice,
      ...paidState,
    };
  }

  /**
   * Phase 17: Get all payments for an invoice (ordered by paymentReceivedAt asc)
   * @param invoiceId Invoice ID
   * @returns Array of payments
   */
  async getPaymentsForInvoice(invoiceId: string) {
    // Verify invoice exists
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Get payments ordered by paymentReceivedAt ascending
    return this.prisma.invoicePayment.findMany({
      where: { invoiceId },
      orderBy: { paymentReceivedAt: 'asc' },
      include: {
        postedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  /**
   * Phase 17: Create payment for an invoice
   * @param invoiceId Invoice ID
   * @param input Payment input
   * @returns Created payment
   */
  async createPaymentForInvoice(
    invoiceId: string,
    input: Omit<CreateInvoicePaymentInput, 'invoiceId'>,
  ) {
    return this.invoicePaymentsService.createPayment({
      ...input,
      invoiceId,
    });
  }

  /**
   * Phase 18: Server-generated invoice PDF (ISSUED only, customer-scoped)
   */
  async getInvoicePdf(invoiceId: string, user: any): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        customerId: true,
        status: true,
        issuedAt: true,
        subtotalAmountCents: true,
        totalAmountCents: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Customer scoping (only enforce if caller is a customer user)
    if (user?.customerId && invoice.customerId !== user.customerId) {
      throw new ForbiddenException('Forbidden');
    }

    // PDF only allowed for ISSUED invoices
    if (invoice.status !== 'ISSUED') {
      throw new BadRequestException(
        'Only ISSUED invoices can be downloaded as PDF',
      );
    }

    const paidState = await this.computePaidState(invoiceId);

    const dollars = (cents: number) => (cents / 100).toFixed(2);

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      doc.fontSize(20).text('MW4H Invoice', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Invoice ID: ${invoice.id}`);
      doc.text(`Status: ${invoice.status}`);
      if (invoice.issuedAt) {
        doc.text(`Issued At: ${invoice.issuedAt.toISOString()}`);
      }
      doc.moveDown();

      doc.text(`Total: $${dollars(invoice.totalAmountCents)}`);
      doc.text(`Total Paid: $${dollars(paidState.totalPaidCents)}`);
      doc.text(`Balance: $${dollars(paidState.balanceCents)}`);

      doc.end();
    });
  }

  /**
   * Phase 18+ Option A Step A6: Admin override for ROUTE_ADMIN invoices
   * @param invoiceId Invoice ID
   * @param userId User ID performing the override
   * @param note Optional override note
   * @returns Simple success response
   */
  async overrideRouting(invoiceId: string, userId: string, note?: string): Promise<{ ok: true; id: string }> {
    // Must require invoice exists
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        status: true,
        routingReason: true,
        routedToAdminAt: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Must require invoice.status === DRAFT (do not override issued invoices)
    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT invoices can have routing overridden');
    }

    // Must require invoice.routingReason is set OR routedToAdminAt is set (so we only override routed invoices)
    if (!invoice.routingReason && !invoice.routedToAdminAt) {
      throw new BadRequestException('Can only override routing for invoices that have been routed');
    }

    // Update invoice with override data
    const trimmedNote = (note ?? '').trim();
    const approvalNote = trimmedNote ? `ADMIN_OVERRIDE: ${trimmedNote}` : 'ADMIN_OVERRIDE';

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedByUserId: userId,
        approvalNote,
        routedByUserId: userId, // Audit who handled routing
      },
    });

    return { ok: true, id: invoiceId };
  }

  /**
   * Phase 18+ Option A Step A7: List routed invoices (admin-only)
   * @returns Array of routed invoices ordered by routedToAdminAt DESC
   */
  async listRoutedInvoices() {
    return this.prisma.invoice.findMany({
      where: {
        status: 'DRAFT',
        routedToAdminAt: {
          not: null,
        },
      },
      orderBy: {
        routedToAdminAt: 'desc',
      },
      select: {
        id: true,
        invoiceNumber: true,
        customerId: true,
        orderId: true,
        routedToAdminAt: true,
        routingReason: true,
        approvalStatus: true,
        approvedAt: true,
        approvedByUserId: true,
      },
    });
  }

  /**
   * Phase 18+ Option A — Step A8.1
   * Admin approves a routed invoice
   */
  async approveRoutedInvoice(invoiceId: string, adminUserId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (!invoice.routedToAdminAt) {
      throw new BadRequestException('Invoice is not routed for admin review');
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        routedToAdminAt: null,
        approvedAt: new Date(),
        approvedByUserId: adminUserId,
        approvalStatus: ApprovalStatus.APPROVED,
      },
    });
  }

  // -------------------------------
  // Step 3 — Draft Line Item Composition
  // -------------------------------

  /**
   * Recompute invoice totals from line items (deterministic, cents-based)
   */
  private async recomputeInvoiceTotals(
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
    invoiceId: string,
  ): Promise<{ subtotalAmountCents: number; totalAmountCents: number }> {
    const lineItems = await tx.invoiceLineItem.findMany({
      where: { invoiceId },
      select: { lineTotalCents: true },
    });

    const subtotalAmountCents = lineItems.reduce(
      (sum, item) => sum + (item.lineTotalCents ?? 0),
      0,
    );
    const totalAmountCents = subtotalAmountCents; // No tax/adjustments for now

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { subtotalAmountCents, totalAmountCents },
    });

    return { subtotalAmountCents, totalAmountCents };
  }

  /**
   * Add line item to draft invoice
   */
  async addLineItem(
    invoiceId: string,
    input: {
      type: string;
      description?: string;
      amount: number;
      quantity?: number;
      tradeCode?: string;
      state?: string;
      isCommissionable?: boolean;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        select: { id: true, status: true },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.status !== 'DRAFT') {
        throw new BadRequestException('Line items can only be added to DRAFT invoices');
      }

      const qty = input.quantity ?? 1;
      const unitRateCents = this.toCents(input.amount);
      const lineTotalCents = this.toCents(input.amount * qty);

      await tx.invoiceLineItem.create({
        data: {
          invoiceId,
          type: input.type as any,
          description: input.description,
          amount: input.amount,
          quantity: input.quantity,
          unitRateCents,
          lineTotalCents,
          tradeCode: input.tradeCode,
          state: input.state,
          isCommissionable: input.isCommissionable ?? true,
        },
      });

      const totals = await this.recomputeInvoiceTotals(tx, invoiceId);

      const updatedInvoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { lineItems: true },
      });

      return {
        ...updatedInvoice,
        ...totals,
      };
    });
  }

  /**
   * Update line item on draft invoice
   */
  async updateLineItem(
    invoiceId: string,
    lineItemId: string,
    input: {
      type?: string;
      description?: string;
      amount?: number;
      quantity?: number;
      tradeCode?: string;
      state?: string;
      isCommissionable?: boolean;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        select: { id: true, status: true },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.status !== 'DRAFT') {
        throw new BadRequestException('Line items can only be updated on DRAFT invoices');
      }

      const lineItem = await tx.invoiceLineItem.findUnique({
        where: { id: lineItemId },
        select: { id: true, invoiceId: true, amount: true, quantity: true },
      });

      if (!lineItem || lineItem.invoiceId !== invoiceId) {
        throw new NotFoundException('Line item not found');
      }

      // Build update data
      const updateData: any = {};

      if (input.type !== undefined) {
        updateData.type = input.type;
      }
      if (input.description !== undefined) {
        updateData.description = input.description;
      }
      if (input.tradeCode !== undefined) {
        updateData.tradeCode = input.tradeCode;
      }
      if (input.state !== undefined) {
        updateData.state = input.state;
      }
      if (input.isCommissionable !== undefined) {
        updateData.isCommissionable = input.isCommissionable;
      }

      // Recompute cents if amount or quantity changed
      const newAmount = input.amount ?? lineItem.amount;
      const newQuantity = input.quantity ?? lineItem.quantity ?? 1;

      if (input.amount !== undefined || input.quantity !== undefined) {
        updateData.amount = newAmount;
        updateData.quantity = input.quantity ?? lineItem.quantity;
        updateData.unitRateCents = this.toCents(newAmount);
        updateData.lineTotalCents = this.toCents(newAmount * newQuantity);
      }

      await tx.invoiceLineItem.update({
        where: { id: lineItemId },
        data: updateData,
      });

      const totals = await this.recomputeInvoiceTotals(tx, invoiceId);

      const updatedInvoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { lineItems: true },
      });

      return {
        ...updatedInvoice,
        ...totals,
      };
    });
  }

  /**
   * Remove line item from draft invoice
   */
  async removeLineItem(invoiceId: string, lineItemId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        select: { id: true, status: true },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.status !== 'DRAFT') {
        throw new BadRequestException('Line items can only be removed from DRAFT invoices');
      }

      const lineItem = await tx.invoiceLineItem.findUnique({
        where: { id: lineItemId },
        select: { id: true, invoiceId: true },
      });

      if (!lineItem || lineItem.invoiceId !== invoiceId) {
        throw new NotFoundException('Line item not found');
      }

      await tx.invoiceLineItem.delete({
        where: { id: lineItemId },
      });

      const totals = await this.recomputeInvoiceTotals(tx, invoiceId);

      const updatedInvoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { lineItems: true },
      });

      return {
        ...updatedInvoice,
        ...totals,
      };
    });
  }

  // -------------------------------
  // B1–B4: Internal Invoice View (Read-Only)
  // F2: Extended with payment ledger visibility
  // -------------------------------

  /**
   * B1–B4: Get internal invoice view with adjustments and computed totals.
   * F2: Extended with payments ledger, payment totals, and payment status badge.
   * Read-only endpoint; no mutations.
   *
   * @param invoiceId Invoice ID
   * @returns InternalInvoiceViewResponse with invoice, adjustments, totals, and payments ledger
   */
  async getInternalInvoiceView(invoiceId: string): Promise<InternalInvoiceViewResponse> {
    // Fetch invoice with core fields
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        invoiceNumber: true,
        customerId: true,
        orderId: true,
        status: true,
        issuedAt: true,
        subtotalAmountCents: true,
        totalAmountCents: true,
        issuedSnapshotJson: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Compute paid state (read-only)
    const paidState = await this.computePaidState(invoiceId);

    // F2: Fetch payments ledger (ordered newest -> oldest by paymentPostedAt DESC, createdAt DESC)
    const paymentsLedger: PaymentLedgerItem[] =
      await this.invoicePaymentsService.getPaymentsLedgerForInvoice(invoiceId);

    // F2: Compute payment totals
    const invoiceTotalCents = invoice.totalAmountCents;
    const totalPaidCents = paidState.totalPaidCents;
    const balanceCents = Math.max(0, invoiceTotalCents - totalPaidCents);

    const paymentTotals: PaymentTotals = {
      totalPaidCents,
      invoiceTotalCents,
      balanceCents,
    };

    // F2: Derive payment status badge
    let paymentStatusBadge: PaymentStatusBadge;
    if (totalPaidCents === 0) {
      paymentStatusBadge = 'UNPAID';
    } else if (balanceCents === 0 && invoiceTotalCents > 0) {
      paymentStatusBadge = 'PAID';
    } else {
      paymentStatusBadge = 'PARTIALLY_PAID';
    }

    // Fetch ISSUED adjustments only (per spec: only ISSUED adjustments included in view)
    const adjustments = await this.prisma.invoiceAdjustment.findMany({
      where: {
        invoiceId,
        status: 'ISSUED',
      },
      orderBy: { issuedAt: 'asc' },
      select: {
        adjustmentNumber: true,
        type: true,
        status: true,
        issuedAt: true,
        amountCents: true,
        reason: true,
      },
    });

    // Transform adjustments to view model with signed amounts
    // signedAmount: CREDIT => -amount, DEBIT => +amount
    const adjustmentViews: InternalAdjustmentView[] = adjustments.map((adj) => {
      const signedAmount = adj.type === 'CREDIT' ? -adj.amountCents : adj.amountCents;
      return {
        adjustmentNumber: adj.adjustmentNumber,
        type: adj.type as 'CREDIT' | 'DEBIT',
        status: adj.status as 'DRAFT' | 'ISSUED',
        issuedAt: adj.issuedAt,
        amount: adj.amountCents,
        signedAmount,
        reason: adj.reason,
      };
    });

    // Compute totals
    // adjustmentsNet = sum(signedAmount) for ISSUED adjustments
    const adjustmentsNet = adjustmentViews.reduce((sum, adj) => sum + adj.signedAmount, 0);

    // invoiceBalanceDue = invoice balance after payments (balanceCents from paidState)
    const invoiceBalanceDue = paidState.balanceCents;

    // netBalanceDue = invoiceBalanceDue + adjustmentsNet
    const netBalanceDue = invoiceBalanceDue + adjustmentsNet;

    return {
      ok: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        orderId: invoice.orderId,
        status: invoice.status,
        issuedAt: invoice.issuedAt,
        subtotalAmountCents: invoice.subtotalAmountCents,
        totalAmountCents: invoice.totalAmountCents,
        balanceDue: paidState.balanceCents,
        totalPaidCents: paidState.totalPaidCents,
        isPaid: paidState.isPaid,
        issuedSnapshotJson: invoice.issuedSnapshotJson,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      },
      adjustments: adjustmentViews,
      totals: {
        invoiceBalanceDue,
        adjustmentsNet,
        netBalanceDue,
      },
      // F2: Payment ledger visibility
      paymentsLedger,
      paymentTotals,
      paymentStatusBadge,
    };
  }
}
