// E:\JARVIS\02_backend\src\invoices\invoice-approval-routing.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceCutoffService } from './invoice-cutoff.service';

export type InvoiceRoutingOutcomeAction =
  | 'PROCEED_ISSUE'
  | 'ROUTE_ADMIN'
  | 'ROUTE_CUSTOMER_APPROVAL';

export interface InvoiceRoutingOutcome {
  action: InvoiceRoutingOutcomeAction;
  requiresCustomerApproval: boolean;
  missedCutoff: boolean;
  cutoffAtUtc: Date;
  evaluatedAtUtc: Date;
  reasons: string[];
}

@Injectable()
export class InvoiceApprovalRoutingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cutoff: InvoiceCutoffService,
  ) {}

  async evaluateInvoiceRouting(
    invoiceId: string,
    now: Date = new Date(),
  ): Promise<InvoiceRoutingOutcome> {
    // Load invoice with orderId, customerId, approvalStatus, and approvalNote (for admin override check)
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        orderId: true,
        customerId: true,
        approvalStatus: true,
        approvalNote: true,
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    if (!invoice.orderId) {
      throw new BadRequestException(
        'Invoice routing requires an orderId to determine period end.',
      );
    }

    // Load Order by invoice.orderId (separate lookup)
    const order = await this.prisma.order.findUnique({
      where: { id: invoice.orderId },
      select: { id: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Determine period end from Order's hours entries (max periodEnd)
    // Since Order doesn't have periodEnd directly, we get it from HoursEntry
    const hoursEntries = await this.prisma.hoursEntry.findMany({
      where: { orderId: invoice.orderId },
      select: { periodEnd: true },
      orderBy: { periodEnd: 'desc' },
      take: 1,
    });

    if (hoursEntries.length === 0 || !hoursEntries[0].periodEnd) {
      throw new BadRequestException(
        'Invoice routing requires a periodEnd date. No hours entries found for the order.',
      );
    }

    const periodEnd = hoursEntries[0].periodEnd;

    // Load Customer by invoice.customerId (separate lookup)
    const customer = await this.prisma.customer.findUnique({
      where: { id: invoice.customerId },
      select: { requiresInvoiceApproval: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Use the real cutoff method from InvoiceCutoffService
    const cutoffAtUtc = this.cutoff.getCutoffForInvoicePeriod({
      periodEnd,
    });
    const missedCutoff = now.getTime() > cutoffAtUtc.getTime();

    // Default requiresInvoiceApproval to false if null
    const requiresCustomerApproval = Boolean(
      customer.requiresInvoiceApproval ?? false,
    );

    const reasons: string[] = [];
    let action: InvoiceRoutingOutcomeAction = 'PROCEED_ISSUE';

    // Phase 18+ Option A Step A6: Check for admin override
    const isAdminOverride =
      invoice.approvalStatus === 'APPROVED' &&
      (invoice.approvalNote ?? '').startsWith('ADMIN_OVERRIDE');

    // Rule order matters: cutoff overrides approval, but admin override can bypass cutoff.
    if (missedCutoff && !isAdminOverride) {
      action = 'ROUTE_ADMIN';
      reasons.push('Missed cutoff');
    } else if (missedCutoff && isAdminOverride) {
      action = 'PROCEED_ISSUE';
      reasons.push('Admin override');
    } else if (requiresCustomerApproval) {
      action = 'ROUTE_CUSTOMER_APPROVAL';
      reasons.push('Customer requires approval');
    }

    return {
      action,
      requiresCustomerApproval,
      missedCutoff,
      cutoffAtUtc,
      evaluatedAtUtc: now,
      reasons,
    };
  }
}
