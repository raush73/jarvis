// D:\JARVIS\02_backend\src\invoice-payments\invoice-payments.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TradeMarginSnapshotService } from '../finance/trade-margin-snapshot.service';
import { CommissionsService } from '../commissions/commissions.service';
import type { PaymentLedgerItem } from '../invoices/dto/internal-invoice-view.dto';

export type CreateInvoicePaymentInput = {
  invoiceId: string;

  // Dates/times (store as Date in DB)
  paymentReceivedAt: Date;
  paymentPostedAt: Date;

  // Optional operational timestamp
  bankDepositAt?: Date;

  // Always from JWT in controller
  postedByUserId: string;

  // Optional for now
  backdateReason?: string;

  // Prisma: amount Float (required)
  amount: number;

  // Optional source marker (import/manual/etc.)
  source?: string;
};

@Injectable()
export class InvoicePaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tradeMarginSnapshot: TradeMarginSnapshotService,
    private readonly commissionsService: CommissionsService,
  ) {}

  /**
   * Phase 8 core entry point:
   * create InvoicePayment => create immutable trade margin snapshot (MVP placeholder)
   */
  async createPayment(input: CreateInvoicePaymentInput) {
    const {
      invoiceId,
      paymentReceivedAt,
      paymentPostedAt,
      bankDepositAt,
      postedByUserId,
      backdateReason,
      amount,
      source,
    } = input;

    // --- Basic validation (MVP-safe) ---
    if (!invoiceId) throw new BadRequestException('invoiceId is required');

    if (!postedByUserId) {
      throw new BadRequestException('postedByUserId is required');
    }

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('amount must be a positive number');
    }

    if (!(paymentReceivedAt instanceof Date) || isNaN(paymentReceivedAt.getTime())) {
      throw new BadRequestException('paymentReceivedAt must be a valid Date');
    }

    if (!(paymentPostedAt instanceof Date) || isNaN(paymentPostedAt.getTime())) {
      throw new BadRequestException('paymentPostedAt must be a valid Date');
    }

    // Disallow impossible ordering (posting before received)
    if (paymentPostedAt.getTime() < paymentReceivedAt.getTime()) {
      throw new BadRequestException(
        'paymentPostedAt cannot be earlier than paymentReceivedAt',
      );
    }

    if (bankDepositAt) {
      if (!(bankDepositAt instanceof Date) || isNaN(bankDepositAt.getTime())) {
        throw new BadRequestException('bankDepositAt must be a valid Date when provided');
      }
      if (bankDepositAt.getTime() < paymentReceivedAt.getTime()) {
        throw new BadRequestException(
          'bankDepositAt cannot be earlier than paymentReceivedAt',
        );
      }
      // F3: bankDepositAt must also be >= paymentPostedAt
      if (bankDepositAt.getTime() < paymentPostedAt.getTime()) {
        throw new BadRequestException(
          'bankDepositAt cannot be earlier than paymentPostedAt',
        );
      }
    }

    // F3: Backdate justification rule
    // "Backdated" = paymentPostedAt < (now - 1 calendar day)
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    oneDayAgo.setHours(0, 0, 0, 0); // Start of day 1 day ago

    const isBackdated = paymentPostedAt.getTime() < oneDayAgo.getTime();
    const hasBackdateReason = backdateReason && backdateReason.trim().length > 0;

    if (isBackdated && !hasBackdateReason) {
      throw new BadRequestException(
        'backdateReason is required when paymentPostedAt is more than 1 day in the past',
      );
    }

    // Minimal backdate note guard (when provided, must be meaningful)
    if (hasBackdateReason && backdateReason.trim().length < 5) {
      throw new BadRequestException(
        'backdateReason must be at least 5 characters when provided',
      );
    }

    // --- Phase 17: Ensure invoice exists and validate status ---
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, status: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    // Phase 17: Payments can only be created for Invoice.status = ISSUED
    // VOIDED invoices cannot accept new payments (operationally VOIDED wins)
    if (invoice.status !== 'ISSUED') {
      const errorMessage =
        invoice.status === 'VOIDED'
          ? 'Cannot create payment: invoice status is VOIDED'
          : `Cannot create payment: invoice status must be ISSUED, got ${invoice.status}`;
      throw new BadRequestException(errorMessage);
    }

    // --- Create payment row ---
    const created = await this.prisma.invoicePayment.create({
      data: {
        invoiceId,
        amount,
        paymentReceivedAt,
        paymentPostedAt,
        bankDepositAt: bankDepositAt ?? null,
        postedByUserId,
        backdateReason: backdateReason ?? null,
        source: source ?? null,
      },
    });

    // --- Create or retrieve snapshot (burden-based GP, idempotent) ---
    // FIN-COMM-GP-01: Returns existing snapshot for 2nd+ payments (multi-payment safe).
    await this.tradeMarginSnapshot.createSnapshotForInvoice({
      invoiceId: created.invoiceId,
      amount: created.amount,
    });

    // --- Commission trigger (Phase F1): create commission events for this payment ---
    // Uses upsert internally; idempotent-safe if retried.
    await this.commissionsService.createCommissionEventsForPayment({
      invoicePaymentId: created.id,
    });

    // --- F4: Advisory-only duplicate detection (runs AFTER successful insert) ---
    const duplicateWarning = await this.detectPotentialDuplicates(created);

    // Return with optional advisory warning (omit if no matches)
    if (duplicateWarning) {
      return { ...created, duplicateWarning };
    }

    return created;
  }

  /**
   * F4: Advisory-only duplicate detection heuristic.
   *
   * A payment is a POTENTIAL DUPLICATE if:
   * - invoiceId matches
   * - amountCents matches
   * - AND temporal proximity: same paymentPostedAt calendar date OR within 3 days
   *
   * This is HEURISTIC ONLY and NEVER blocks, rejects, or persists.
   *
   * @param payment The just-inserted payment record
   * @returns Advisory warning object or undefined if no matches
   */
  private async detectPotentialDuplicates(payment: {
    id: string;
    invoiceId: string;
    amount: number;
    paymentPostedAt: Date;
  }): Promise<
    | {
        suspected: boolean;
        matches: Array<{
          paymentId: string;
          amountCents: number;
          paymentPostedAt: string;
          postedByUserId: string;
          createdAt: string;
        }>;
      }
    | undefined
  > {
    // Query other payments for same invoice (exclude the just-created one)
    const otherPayments = await this.prisma.invoicePayment.findMany({
      where: {
        invoiceId: payment.invoiceId,
        id: { not: payment.id },
      },
      select: {
        id: true,
        amount: true,
        paymentPostedAt: true,
        postedByUserId: true,
        createdAt: true,
      },
    });

    if (otherPayments.length === 0) {
      return undefined;
    }

    // Convert current payment amount to cents for comparison
    const currentAmountCents = Math.round(payment.amount * 100);
    const currentPostedAt = payment.paymentPostedAt;

    // Helper: check if two dates are on the same calendar day (UTC)
    const isSameCalendarDay = (d1: Date, d2: Date): boolean => {
      return (
        d1.getUTCFullYear() === d2.getUTCFullYear() &&
        d1.getUTCMonth() === d2.getUTCMonth() &&
        d1.getUTCDate() === d2.getUTCDate()
      );
    };

    // Helper: check if dates are within 3 days of each other
    const isWithinThreeDays = (d1: Date, d2: Date): boolean => {
      const diffMs = Math.abs(d1.getTime() - d2.getTime());
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      return diffMs <= threeDaysMs;
    };

    // Apply heuristic: same amount AND temporal proximity
    const matches = otherPayments
      .filter((p) => {
        // Amount must match (convert to cents)
        const otherAmountCents = Math.round(p.amount * 100);
        if (otherAmountCents !== currentAmountCents) {
          return false;
        }

        // Temporal proximity: same calendar day OR within 3 days
        if (!p.paymentPostedAt) {
          return false;
        }
        return (
          isSameCalendarDay(currentPostedAt, p.paymentPostedAt) ||
          isWithinThreeDays(currentPostedAt, p.paymentPostedAt)
        );
      })
      .map((p) => ({
        paymentId: p.id,
        amountCents: Math.round(p.amount * 100),
        paymentPostedAt: p.paymentPostedAt!.toISOString(),
        postedByUserId: p.postedByUserId,
        createdAt: p.createdAt.toISOString(),
      }));

    // Omit warning entirely if no matches
    if (matches.length === 0) {
      return undefined;
    }

    return {
      suspected: true,
      matches,
    };
  }

  /**
   * F2: Get payments ledger for internal audit visibility (READ-ONLY).
   *
   * Ordering: paymentPostedAt DESC (nulls last), then createdAt DESC.
   * Converts amount (Float dollars) to amountCents (Int).
   *
   * @param invoiceId Invoice ID
   * @returns Array of PaymentLedgerItem ordered newest -> oldest
   */
  async getPaymentsLedgerForInvoice(invoiceId: string): Promise<PaymentLedgerItem[]> {
    const payments = await this.prisma.invoicePayment.findMany({
      where: { invoiceId },
      orderBy: [
        { paymentPostedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        amount: true,
        source: true,
        paymentReceivedAt: true,
        paymentPostedAt: true,
        bankDepositAt: true,
        backdateReason: true,
        postedByUserId: true,
        createdAt: true,
      },
    });

    // Transform to ledger format and ISO dates
    return payments.map((p) => ({
      id: p.id,
      amountCents: Number.parseInt((p.amount * 100).toFixed(0), 10),
      source: p.source,
      paymentReceivedAt: p.paymentReceivedAt?.toISOString() ?? null,
      paymentPostedAt: p.paymentPostedAt?.toISOString() ?? null,
      bankDepositAt: p.bankDepositAt?.toISOString() ?? null,
      backdateReason: p.backdateReason,
      postedByUserId: p.postedByUserId,
      createdAt: p.createdAt.toISOString(),
    }));
  }
}
