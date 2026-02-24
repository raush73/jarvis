/**
 * Customer Invoice View - Print-Friendly HTML Generation
 *
 * READ-ONLY view. No mutations. No branding. No legal text.
 * Renders ISSUED invoice snapshot with full detail (workers + line items).
 * Includes ISSUED adjustments only.
 */

export interface CustomerInvoiceLineItem {
  id: string;
  type: string;
  description: string | null;
  quantity: number | null;
  unitRateCents: number | null;
  lineTotalCents: number | null;
  tradeCode: string | null;
}

export interface CustomerInvoiceWorker {
  id: string;
  workerId: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  type: string;
}

export interface CustomerInvoiceAdjustment {
  adjustmentNumber: string | null;
  type: 'CREDIT' | 'DEBIT';
  amountCents: number;
  signedAmountCents: number;
  reason: string | null;
  issuedAt: Date | null;
}

export interface CustomerInvoiceData {
  invoiceNumber: string | null;
  issuedAt: Date | null;
  customerName: string;
  lineItems: CustomerInvoiceLineItem[];
  workers: CustomerInvoiceWorker[];
  adjustments: CustomerInvoiceAdjustment[];
  subtotalAmountCents: number;
  totalAmountCents: number;
  totalPaidCents: number;
  balanceDueCents: number;
  adjustmentsNetCents: number;
  netBalanceDueCents: number;
  /** Footer text from INVOICE_FOOTER_TEXT global setting */
  footerText: string;
}

function formatCents(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderCustomerInvoiceHtml(data: CustomerInvoiceData): string {
  const lineItemsHtml = data.lineItems
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.description) || escapeHtml(item.type)}</td>
          <td>${escapeHtml(item.tradeCode) || '—'}</td>
          <td class="text-right">${item.quantity ?? '—'}</td>
          <td class="text-right">${item.unitRateCents != null ? formatCents(item.unitRateCents) : '—'}</td>
          <td class="text-right">${item.lineTotalCents != null ? formatCents(item.lineTotalCents) : '—'}</td>
        </tr>
      `,
    )
    .join('');

  const workersHtml =
    data.workers.length > 0
      ? `
        <section class="workers-section">
          <h2>Labor Details</h2>
          <table>
            <thead>
              <tr>
                <th>Worker ID</th>
                <th>Period</th>
                <th>Type</th>
                <th class="text-right">Hours</th>
              </tr>
            </thead>
            <tbody>
              ${data.workers
                .map(
                  (w) => `
                <tr>
                  <td>${escapeHtml(w.workerId)}</td>
                  <td>${formatDate(w.periodStart)} – ${formatDate(w.periodEnd)}</td>
                  <td>${escapeHtml(w.type)}</td>
                  <td class="text-right">${w.totalHours.toFixed(2)}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </section>
      `
      : '';

  const adjustmentsHtml =
    data.adjustments.length > 0
      ? `
        <section class="adjustments-section">
          <h2>Adjustments</h2>
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Date</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${data.adjustments
                .map(
                  (adj) => `
                <tr>
                  <td>${escapeHtml(adj.adjustmentNumber) || '—'}</td>
                  <td>${adj.type}</td>
                  <td>${escapeHtml(adj.reason) || '—'}</td>
                  <td>${formatDate(adj.issuedAt)}</td>
                  <td class="text-right ${adj.signedAmountCents < 0 ? 'credit' : 'debit'}">${formatCents(adj.signedAmountCents)}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="text-right"><strong>Adjustments Total</strong></td>
                <td class="text-right ${data.adjustmentsNetCents < 0 ? 'credit' : 'debit'}"><strong>${formatCents(data.adjustmentsNetCents)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </section>
      `
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${escapeHtml(data.invoiceNumber)}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1a1a1a;
      background: #fff;
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    h2 {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e5e5e5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #1a1a1a;
    }
    .header-left h1 {
      margin-bottom: 0.25rem;
    }
    .header-left .customer {
      color: #666;
    }
    .header-right {
      text-align: right;
    }
    .header-right .invoice-number {
      font-size: 1.25rem;
      font-weight: 600;
    }
    .header-right .invoice-date {
      color: #666;
    }
    section {
      margin-bottom: 2rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
    }
    th, td {
      padding: 0.625rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e5e5;
    }
    th {
      font-weight: 600;
      background: #f9f9f9;
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    tbody tr:hover {
      background: #fafafa;
    }
    tfoot td {
      border-top: 2px solid #1a1a1a;
      border-bottom: none;
      font-weight: 600;
    }
    .text-right {
      text-align: right;
    }
    .credit {
      color: #047857;
    }
    .debit {
      color: #b91c1c;
    }
    .totals-section {
      background: #f9f9f9;
      padding: 1.5rem;
      border-radius: 4px;
    }
    .totals-grid {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.5rem 2rem;
      max-width: 350px;
      margin-left: auto;
    }
    .totals-grid .label {
      text-align: right;
    }
    .totals-grid .value {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .totals-grid .total-row {
      font-weight: 600;
      font-size: 1.125rem;
      padding-top: 0.5rem;
      border-top: 1px solid #d1d1d1;
      margin-top: 0.5rem;
    }
    .footer-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e5e5;
    }
    .footer-section h2 {
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }
    .footer-section p {
      color: #444;
      font-size: 0.9375rem;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .print-button {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 0.75rem 1.5rem;
      background: #1a1a1a;
      color: #fff;
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .print-button:hover {
      background: #333;
    }
    @media print {
      body {
        padding: 0;
        font-size: 12px;
      }
      .print-button {
        display: none;
      }
      section {
        page-break-inside: avoid;
      }
      .totals-section {
        background: none;
        border: 1px solid #ccc;
      }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-left">
      <h1>Invoice</h1>
      <div class="customer">${escapeHtml(data.customerName)}</div>
    </div>
    <div class="header-right">
      <div class="invoice-number">${escapeHtml(data.invoiceNumber) || '—'}</div>
      <div class="invoice-date">Issued: ${formatDate(data.issuedAt)}</div>
    </div>
  </header>

  <section class="line-items-section">
    <h2>Line Items</h2>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Trade</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml || '<tr><td colspan="5">No line items</td></tr>'}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" class="text-right">Subtotal</td>
          <td class="text-right">${formatCents(data.subtotalAmountCents)}</td>
        </tr>
      </tfoot>
    </table>
  </section>

  ${workersHtml}

  ${adjustmentsHtml}

  <section class="totals-section">
    <div class="totals-grid">
      <div class="label">Invoice Total</div>
      <div class="value">${formatCents(data.totalAmountCents)}</div>

      <div class="label">Payments Received</div>
      <div class="value">(${formatCents(data.totalPaidCents)})</div>

      <div class="label">Invoice Balance</div>
      <div class="value">${formatCents(data.balanceDueCents)}</div>

      ${
        data.adjustments.length > 0
          ? `
      <div class="label">Adjustments</div>
      <div class="value ${data.adjustmentsNetCents < 0 ? 'credit' : 'debit'}">${formatCents(data.adjustmentsNetCents)}</div>
      `
          : ''
      }

      <div class="label total-row">Balance Due</div>
      <div class="value total-row">${formatCents(data.netBalanceDueCents)}</div>
    </div>
  </section>

  <section class="footer-section">
    <h2>Remittance &amp; Terms</h2>
    <p>${data.footerText ? escapeHtml(data.footerText) : 'Remittance and payment terms will be provided by MW4H.'}</p>
  </section>

  <button class="print-button" onclick="window.print()">Print Invoice</button>
</body>
</html>`;
}

export function renderErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice Not Available</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1a1a1a;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
    }
    .error-card {
      background: #fff;
      padding: 3rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      text-align: center;
      max-width: 400px;
    }
    .error-card h1 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: #b91c1c;
    }
    .error-card p {
      color: #666;
    }
  </style>
</head>
<body>
  <div class="error-card">
    <h1>Invoice Not Available</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}

