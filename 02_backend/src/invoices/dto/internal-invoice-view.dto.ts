/**
 * B1–B4: Internal Invoice View DTO
 * Read-only view model for internal invoice review with adjustments.
 *
 * F2: Extended with payment ledger visibility for internal audit.
 */

export interface InternalAdjustmentView {
  adjustmentNumber: string | null;
  type: 'CREDIT' | 'DEBIT';
  status: 'DRAFT' | 'ISSUED';
  issuedAt: Date | null;
  amount: number; // amountCents (unsigned)
  signedAmount: number; // CREDIT => -amount, DEBIT => +amount
  memo?: string | null;
  reason?: string | null;
}

/**
 * F2: Payment ledger item for internal audit visibility.
 * All dates are ISO strings for consistent serialization.
 */
export interface PaymentLedgerItem {
  id: string;
  amountCents: number;
  source: string | null;
  paymentReceivedAt: string | null; // ISO
  paymentPostedAt: string | null; // ISO
  bankDepositAt: string | null; // ISO
  backdateReason: string | null;
  postedByUserId: string | null;
  createdAt: string; // ISO
}

/**
 * F2: Payment status badge derived from totals.
 */
export type PaymentStatusBadge = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

/**
 * F2: Payment totals for internal invoice view.
 */
export interface PaymentTotals {
  totalPaidCents: number;
  invoiceTotalCents: number;
  balanceCents: number; // max(0, invoiceTotalCents - totalPaidCents)
}

export interface InternalInvoiceTotals {
  invoiceBalanceDue: number; // cents (invoice.totalAmountCents - totalPaidCents)
  adjustmentsNet: number; // cents (sum of signedAmount for ISSUED adjustments)
  netBalanceDue: number; // cents (invoiceBalanceDue + adjustmentsNet)
}

export interface InternalInvoiceViewResponse {
  ok: true;
  invoice: {
    id: string;
    invoiceNumber: string | null;
    customerId: string;
    orderId: string | null;
    status: string;
    issuedAt: Date | null;
    subtotalAmountCents: number;
    totalAmountCents: number;
    balanceDue: number; // cents (totalAmountCents - totalPaidCents)
    totalPaidCents: number;
    isPaid: boolean;
    issuedSnapshotJson: unknown;
    createdAt: Date;
    updatedAt: Date;
  };
  adjustments: InternalAdjustmentView[];
  totals: InternalInvoiceTotals;
  /** F2: Payment ledger for internal audit (ordered newest -> oldest by paymentPostedAt DESC, then createdAt DESC) */
  paymentsLedger: PaymentLedgerItem[];
  /** F2: Payment totals derived from ledger */
  paymentTotals: PaymentTotals;
  /** F2: Derived payment status badge */
  paymentStatusBadge: PaymentStatusBadge;
}

