import { Controller, Get, Param, Header } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MagicLinksService } from '../../../magic-links/magic-links.service';
import { MagicLinkError } from '../../../magic-links/magic-link.errors';
import { SettingsService } from '../../../settings/settings.service';
import {
  renderCustomerInvoiceHtml,
  renderErrorPage,
  CustomerInvoiceData,
  CustomerInvoiceLineItem,
  CustomerInvoiceWorker,
  CustomerInvoiceAdjustment,
} from '../views/customer-invoice.view';

/**
 * Customer Invoice Portal Controller
 *
 * READ-ONLY. No mutations. No auth required (magic link is the auth).
 *
 * Route: GET /ui/customer/invoice/:token
 *
 * Resolution:
 *   token -> MagicLink (scope: CUSTOMER_VIEW_INVOICE) -> orderId
 *   orderId -> Invoice (status: ISSUED only)
 *
 * Features:
 *   - Full invoice detail from issuedSnapshotJson (line items + workers)
 *   - ISSUED adjustments only (CREDIT/DEBIT)
 *   - Computed totals (display-only)
 *   - Print-friendly HTML
 */
@Controller('ui/customer')
export class CustomerInvoiceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly magicLinks: MagicLinksService,
    private readonly settings: SettingsService,
  ) {}

  @Get('invoice/:token')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async viewInvoice(@Param('token') token: string): Promise<string> {
    // Step 1: Validate magic link token
    let magicLink: { orderId: string | null };
    try {
      magicLink = await this.magicLinks.validateOrThrow({
        token,
        scope: 'CUSTOMER_VIEW_INVOICE',
      });
    } catch (e: unknown) {
      if (e instanceof MagicLinkError) {
        if (e.code === 'EXPIRED') {
          return renderErrorPage('This link has expired.');
        }
        if (e.code === 'USED') {
          return renderErrorPage('This link has already been used.');
        }
      }
      return renderErrorPage('Invalid or expired link.');
    }

    // Step 2: Validate orderId exists on magic link
    if (!magicLink.orderId) {
      return renderErrorPage('Invoice not available.');
    }

    // Step 3: Query Invoice by orderId (ISSUED only)
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        orderId: magicLink.orderId,
        status: 'ISSUED',
      },
      select: {
        id: true,
        invoiceNumber: true,
        issuedAt: true,
        subtotalAmountCents: true,
        totalAmountCents: true,
        issuedSnapshotJson: true,
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invoice) {
      return renderErrorPage('Invoice not available.');
    }

    // Step 4: Extract balance due from ISSUED snapshot (preferred) or fallback to totalAmountCents
    const balanceDueCents = this.extractBalanceDueCents(
      invoice.issuedSnapshotJson,
      invoice.totalAmountCents,
    );

    // Step 5: Query ISSUED adjustments only
    const adjustmentsRaw = await this.prisma.invoiceAdjustment.findMany({
      where: {
        invoiceId: invoice.id,
        status: 'ISSUED',
      },
      orderBy: { issuedAt: 'asc' },
      select: {
        adjustmentNumber: true,
        type: true,
        amountCents: true,
        reason: true,
        issuedAt: true,
      },
    });

    // Step 6: Compute signed amounts per LOCKED MATH
    // signedAmount = CREDIT => -amount, DEBIT => +amount
    const adjustments: CustomerInvoiceAdjustment[] = adjustmentsRaw.map((adj) => {
      const signedAmountCents = adj.type === 'CREDIT' ? -adj.amountCents : adj.amountCents;
      return {
        adjustmentNumber: adj.adjustmentNumber,
        type: adj.type as 'CREDIT' | 'DEBIT',
        amountCents: adj.amountCents,
        signedAmountCents,
        reason: adj.reason,
        issuedAt: adj.issuedAt,
      };
    });

    // adjustmentsNet = sum(signedAmount) for ISSUED adjustments only
    const adjustmentsNetCents = adjustments.reduce((sum, adj) => sum + adj.signedAmountCents, 0);

    // netBalanceDue = invoice.balanceDue + adjustmentsNet
    const netBalanceDueCents = balanceDueCents + adjustmentsNetCents;

    // Step 7: Resolve invoice footer text (snapshot -> settings -> placeholder)
    // Prefer immutable snapshot value for ISSUED invoices
    let footerText: string | undefined;
    if (invoice.issuedSnapshotJson && typeof invoice.issuedSnapshotJson === 'object') {
      const snapshot = invoice.issuedSnapshotJson as Record<string, unknown>;
      if (typeof snapshot.invoiceFooterText === 'string') {
        footerText = snapshot.invoiceFooterText;
      }
    }
    // Fallback to current settings if snapshot does not contain footer
    if (!footerText) {
      footerText = await this.settings.getInvoiceFooterText();
    }
    // View handles final placeholder fallback if footerText is empty

    // Step 8: Extract line items and workers from snapshot
    let lineItems: CustomerInvoiceLineItem[] = [];
    let workers: CustomerInvoiceWorker[] = [];

    if (invoice.issuedSnapshotJson && typeof invoice.issuedSnapshotJson === 'object') {
      const snapshot = invoice.issuedSnapshotJson as Record<string, unknown>;

      // Extract line items from snapshot
      if (Array.isArray(snapshot.lineItems)) {
        lineItems = (snapshot.lineItems as Array<Record<string, unknown>>).map((li) => ({
          id: String(li.id ?? ''),
          type: String(li.type ?? ''),
          description: li.description != null ? String(li.description) : null,
          quantity: typeof li.quantity === 'number' ? li.quantity : null,
          unitRateCents: typeof li.unitRateCents === 'number' ? li.unitRateCents : null,
          lineTotalCents: typeof li.lineTotalCents === 'number' ? li.lineTotalCents : null,
          tradeCode: li.tradeCode != null ? String(li.tradeCode) : null,
        }));
      }

      // Extract workers (approvedHoursEntries) from snapshot
      if (Array.isArray(snapshot.approvedHoursEntries)) {
        workers = (snapshot.approvedHoursEntries as Array<Record<string, unknown>>).map((w) => ({
          id: String(w.id ?? ''),
          workerId: String(w.workerId ?? ''),
          periodStart: String(w.periodStart ?? ''),
          periodEnd: String(w.periodEnd ?? ''),
          totalHours: typeof w.totalHours === 'number' ? w.totalHours : 0,
          type: String(w.type ?? ''),
        }));
      }
    }

    // Step 9: Build view data and render
    const viewData: CustomerInvoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      customerName: invoice.customer.name,
      lineItems,
      workers,
      adjustments,
      subtotalAmountCents: invoice.subtotalAmountCents,
      totalAmountCents: invoice.totalAmountCents,
      totalPaidCents: 0,
      balanceDueCents,
      adjustmentsNetCents,
      netBalanceDueCents,
      footerText,
    };

    return renderCustomerInvoiceHtml(viewData);
  }

  /**
   * Extract balance due cents from ISSUED snapshot with fallback.
   *
   * Checks snapshot for common balance keys in order:
   *   - balanceDueCents
   *   - balanceDueAmountCents
   *   - balanceDue
   *   - balanceDueAmount
   *
   * If found and numeric:
   *   - If appears to be cents (integer >= 100), use directly
   *   - If appears to be dollars (< 100 or has decimals), convert to cents
   *
   * Falls back to totalAmountCents if no snapshot balance found.
   */
  private extractBalanceDueCents(
    snapshotJson: unknown,
    fallbackCents: number,
  ): number {
    if (!snapshotJson || typeof snapshotJson !== 'object') {
      return fallbackCents;
    }

    const snapshot = snapshotJson as Record<string, unknown>;

    // Check keys in priority order
    const balanceKeys = [
      'balanceDueCents',
      'balanceDueAmountCents',
      'balanceDue',
      'balanceDueAmount',
    ];

    for (const key of balanceKeys) {
      const value = snapshot[key];
      if (typeof value === 'number' && !Number.isNaN(value)) {
        // Determine if value is cents or dollars
        // Cents: integer and >= 100 (or explicitly named "Cents")
        // Dollars: has decimals or < 100 (unless explicitly named "Cents")
        const isCentsKey = key.toLowerCase().includes('cents');

        if (isCentsKey) {
          // Explicitly named cents - use as-is (round for safety)
          return Math.round(value);
        }

        // Heuristic: if integer and >= 100, assume cents; otherwise dollars
        const isInteger = Number.isInteger(value);
        if (isInteger && value >= 100) {
          return value;
        }

        // Assume dollars - convert to cents
        return Math.round(value * 100);
      }
    }

    // No valid balance found in snapshot
    return fallbackCents;
  }
}

