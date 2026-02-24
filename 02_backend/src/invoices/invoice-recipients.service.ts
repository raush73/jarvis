import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceRecipientsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Phase 18+ Option B Step B1: Resolve invoice email recipients
   *
   * Rules:
   * - If active LocationInvoiceRecipient exist for invoice.order.locationId → use them
   * - Else use active CustomerInvoiceRecipient for invoice.customerId
   * - Split into TO vs CC based on isCc
   * - Dedupe by email (case-insensitive)
   * - If email appears in both TO and CC, prefer CC (remove from TO)
   *
   * @param invoiceId Invoice ID
   * @returns Object with scopeUsed, to, and cc arrays
   */
  async resolveForInvoice(invoiceId: string): Promise<{
    scopeUsed: 'LOCATION' | 'CUSTOMER';
    to: { email: string; name?: string | null }[];
    cc: { email: string; name?: string | null }[];
  }> {
    // Fetch invoice with customerId and order.locationId
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        customerId: true,
        order: {
          select: {
            locationId: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const locationId = invoice.order?.locationId ?? null;
    let recipients: Array<{
      email: string;
      name?: string | null;
      isCc: boolean;
    }> = [];
    let scopeUsed: 'LOCATION' | 'CUSTOMER' = 'CUSTOMER';

    // If locationId exists, try to fetch active LocationInvoiceRecipient
    if (locationId) {
      const locationRecipients = await this.prisma.locationInvoiceRecipient.findMany({
        where: {
          locationId,
          isActive: true,
        },
        select: {
          email: true,
          name: true,
          isCc: true,
        },
      });

      if (locationRecipients.length > 0) {
        recipients = locationRecipients;
        scopeUsed = 'LOCATION';
      }
    }

    // If no location recipients found, use customer recipients
    if (recipients.length === 0) {
      const customerRecipients = await this.prisma.customerInvoiceRecipient.findMany({
        where: {
          customerId: invoice.customerId,
          isActive: true,
        },
        select: {
          email: true,
          name: true,
          isCc: true,
        },
      });

      recipients = customerRecipients;
      scopeUsed = 'CUSTOMER';
    }

    // Split into TO and CC arrays
    const toMap = new Map<string, { email: string; name?: string | null }>();
    const ccMap = new Map<string, { email: string; name?: string | null }>();

    for (const recipient of recipients) {
      const normalizedEmail = recipient.email.toLowerCase();
      const recipientData = {
        email: recipient.email,
        name: recipient.name,
      };

      if (recipient.isCc) {
        // Add to CC (will overwrite if duplicate)
        ccMap.set(normalizedEmail, recipientData);
      } else {
        // Add to TO (will overwrite if duplicate)
        toMap.set(normalizedEmail, recipientData);
      }
    }

    // If email appears in both TO and CC, prefer CC (remove from TO)
    for (const email of ccMap.keys()) {
      toMap.delete(email);
    }

    return {
      scopeUsed,
      to: Array.from(toMap.values()),
      cc: Array.from(ccMap.values()),
    };
  }
}

