"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

// Mock commission events derived from payment events
const MOCK_COMMISSION_EVENTS = [
  {
    id: "COM-2024-0001",
    invoiceId: "INV-2024-0001",
    customer: "Turner Construction",
    salesperson: "Jordan Miles",
    paymentDate: "2024-01-22",
    daysToPaid: 7,
    bucket: "0–7 days",
    basis: "GP",
    basisAmount: 12500.0,
    commissionRate: 10,
    commissionAmount: 1250.0,
    status: "Paid",
  },
  {
    id: "COM-2024-0002",
    invoiceId: "INV-2024-0002",
    customer: "Skanska USA",
    salesperson: "Taylor Brooks",
    paymentDate: "2024-02-10",
    daysToPaid: 19,
    bucket: "15–30 days",
    basis: "GP",
    basisAmount: 8400.0,
    commissionRate: 6,
    commissionAmount: 504.0,
    status: "Pending",
  },
  {
    id: "COM-2024-0003",
    invoiceId: "INV-2024-0004",
    customer: "DPR Construction",
    salesperson: "Morgan Chen",
    paymentDate: "2024-02-12",
    daysToPaid: 7,
    bucket: "0–7 days",
    basis: "GP",
    basisAmount: 7200.0,
    commissionRate: 10,
    commissionAmount: 720.0,
    status: "Paid",
  },
  {
    id: "COM-2024-0004",
    invoiceId: "INV-2024-0005",
    customer: "Hensel Phelps",
    salesperson: "Jordan Miles",
    paymentDate: "2024-02-18",
    daysToPaid: 8,
    bucket: "8–14 days",
    basis: "GP",
    basisAmount: 14200.0,
    commissionRate: 8,
    commissionAmount: 1136.0,
    status: "Pending",
  },
  {
    id: "COM-2024-0005",
    invoiceId: "INV-2024-0006",
    customer: "Holder Construction",
    salesperson: "Casey Rivera",
    paymentDate: "2024-02-20",
    daysToPaid: 8,
    bucket: "8–14 days",
    basis: "GP",
    basisAmount: 5100.0,
    commissionRate: 8,
    commissionAmount: 408.0,
    status: "Pending",
  },
  {
    id: "COM-2024-0006",
    invoiceId: "INV-2024-0003",
    customer: "McCarthy Building",
    salesperson: "Taylor Brooks",
    paymentDate: "2024-01-15",
    daysToPaid: 0,
    bucket: "0–7 days",
    basis: "GP",
    basisAmount: -3200.0,
    commissionRate: 10,
    commissionAmount: -320.0,
    status: "Reversed",
  },
];

type FilterType = "all" | "pending" | "paid" | "reversed";

// Unique salespeople derived from mock data
const SALESPEOPLE = [
  "Jordan Miles",
  "Taylor Brooks",
  "Morgan Chen",
  "Casey Rivera",
] as const;

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    Pending: {
      background: "rgba(245, 158, 11, 0.15)",
      color: "#f59e0b",
      border: "1px solid rgba(245, 158, 11, 0.3)",
    },
    Paid: {
      background: "rgba(34, 197, 94, 0.15)",
      color: "#22c55e",
      border: "1px solid rgba(34, 197, 94, 0.3)",
    },
    Reversed: {
      background: "rgba(239, 68, 68, 0.15)",
      color: "#ef4444",
      border: "1px solid rgba(239, 68, 68, 0.3)",
    },
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: "5px",
        fontSize: "11px",
        fontWeight: 600,
        ...styles[status],
      }}
    >
      {status}
    </span>
  );
}

export default function AccountingCommissionsPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [salespersonFilter, setSalespersonFilter] = useState<string>("all");

  const filteredEvents = useMemo(() => {
    return MOCK_COMMISSION_EVENTS.filter((evt) => {
      // Status filter
      let statusMatch = true;
      switch (filter) {
        case "pending":
          statusMatch = evt.status === "Pending";
          break;
        case "paid":
          statusMatch = evt.status === "Paid";
          break;
        case "reversed":
          statusMatch = evt.status === "Reversed";
          break;
      }
      // Salesperson filter
      const salespersonMatch =
        salespersonFilter === "all" || evt.salesperson === salespersonFilter;
      return statusMatch && salespersonMatch;
    });
  }, [filter, salespersonFilter]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const totals = useMemo(() => {
    const pending = filteredEvents
      .filter((e) => e.status === "Pending")
      .reduce((sum, e) => sum + e.commissionAmount, 0);
    const paid = filteredEvents
      .filter((e) => e.status === "Paid")
      .reduce((sum, e) => sum + e.commissionAmount, 0);
    return { pending, paid };
  }, [filteredEvents]);

  return (
    <div className="commissions-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <Link href="/accounting" className="back-link">
            ← Back to Money
          </Link>
          <h1>Commission Events</h1>
          <p className="subtitle">
            Commission events generated from recorded invoice payment events.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <span className="card-label">Pending Commissions</span>
          <span className="card-value pending">{formatCurrency(totals.pending)}</span>
        </div>
        <div className="summary-card">
          <span className="card-label">Paid Commissions</span>
          <span className="card-value paid">{formatCurrency(totals.paid)}</span>
        </div>
      </div>

      {/* Filter Tabs + Salesperson Dropdown + Export */}
      <div className="controls-row">
        <div className="filters-left">
          <div className="filter-tabs">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "paid", label: "Paid" },
              { key: "reversed", label: "Reversed" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as FilterType)}
                className={`filter-tab ${filter === tab.key ? "active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            className="salesperson-select"
            value={salespersonFilter}
            onChange={(e) => setSalespersonFilter(e.target.value)}
          >
            <option value="all">All Salespeople</option>
            {SALESPEOPLE.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>
        </div>

        <button className="export-btn" disabled title="Placeholder — no download">
          Export CSV (placeholder)
        </button>
      </div>

      {/* Commission Events Table */}
      <div className="table-wrap">
        <table className="commissions-table">
          <thead>
            <tr>
              <th>Event ID</th>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Salesperson</th>
              <th>Payment Date</th>
              <th>Days-to-Paid</th>
              <th>Basis</th>
              <th style={{ textAlign: "right" }}>Commission</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((evt) => (
              <tr key={evt.id}>
                <td className="cell-id">{evt.id}</td>
                <td className="cell-invoice">{evt.invoiceId}</td>
                <td className="cell-customer">{evt.customer}</td>
                <td className="cell-salesperson">{evt.salesperson}</td>
                <td className="cell-date">{formatDate(evt.paymentDate)}</td>
                <td className="cell-bucket">
                  <span className="bucket-badge">{evt.bucket}</span>
                </td>
                <td className="cell-basis">{evt.basis}</td>
                <td
                  className={`cell-amount ${evt.commissionAmount < 0 ? "negative" : ""}`}
                >
                  {formatCurrency(evt.commissionAmount)}
                </td>
                <td className="cell-status">
                  <StatusBadge status={evt.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredEvents.length === 0 && (
          <div className="empty-state">
            No commission events match the selected filter.
          </div>
        )}
      </div>

      {/* Explainer Note */}
      <div className="explainer">
        <span className="explainer-icon">i</span>
        <span>
          Commission events are generated from recorded invoice payment events.
          The days-to-paid bucket determines the commission tier rate applied.
        </span>
      </div>

      <style jsx>{`
        .commissions-container {
          padding: 24px 40px 60px;
          max-width: 1300px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .back-link {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          transition: color 0.15s ease;
          display: inline-block;
          margin-bottom: 12px;
        }

        .back-link:hover {
          color: #3b82f6;
        }

        h1 {
          font-size: 26px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }

        .subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        /* Summary Cards */
        .summary-cards {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .summary-card {
          flex: 1;
          padding: 20px 24px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .card-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .card-value {
          font-size: 28px;
          font-weight: 700;
          font-family: var(--font-geist-mono), monospace;
        }

        .card-value.pending {
          color: #f59e0b;
        }

        .card-value.paid {
          color: #22c55e;
        }

        /* Controls Row */
        .controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .filters-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .filter-tabs {
          display: flex;
          gap: 8px;
        }

        .salesperson-select {
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.85);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          min-width: 160px;
        }

        .salesperson-select:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }

        .salesperson-select:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.5);
        }

        .salesperson-select option {
          background: #1a1a1a;
          color: rgba(255, 255, 255, 0.85);
        }

        .filter-tab {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.55);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .filter-tab:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        .filter-tab.active {
          color: #fff;
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .export-btn {
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          cursor: not-allowed;
        }

        /* Table */
        .table-wrap {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          overflow: hidden;
        }

        .commissions-table {
          width: 100%;
          border-collapse: collapse;
        }

        .commissions-table thead {
          background: rgba(255, 255, 255, 0.03);
        }

        .commissions-table th {
          padding: 14px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .commissions-table td {
          padding: 14px 16px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .commissions-table tr:last-child td {
          border-bottom: none;
        }

        .cell-id {
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .cell-invoice {
          font-family: var(--font-geist-mono), monospace;
          color: #3b82f6;
          font-weight: 500;
        }

        .cell-customer {
          font-weight: 500;
        }

        .cell-salesperson {
          color: rgba(255, 255, 255, 0.75);
        }

        .cell-date {
          color: rgba(255, 255, 255, 0.65);
        }

        .bucket-badge {
          font-size: 11px;
          padding: 3px 8px;
          background: rgba(148, 163, 184, 0.12);
          color: rgba(148, 163, 184, 0.9);
          border-radius: 4px;
        }

        .cell-basis {
          font-family: var(--font-geist-mono), monospace;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .cell-amount {
          text-align: right;
          font-family: var(--font-geist-mono), monospace;
          font-weight: 600;
        }

        .cell-amount.negative {
          color: #ef4444;
        }

        .empty-state {
          padding: 40px;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 14px;
        }

        /* Explainer */
        .explainer {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 20px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .explainer-icon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.18);
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}

