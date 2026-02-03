"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";

// localStorage key (same as admin)
const CONFIG_KEY = "jarvisPrimeCommissionConfig.v1";

// Locked basis label
const LOCKED_BASIS_LABEL =
  "Trade labor gross margin (REG/OT/DT hours only; excludes per diem/bonus/travel/mob/demob/reimbursements/discounts/credits)";

// Types
type TierConfig = {
  minDays: number;
  maxDays: number | null;
  multiplierPct: number;
};

type CommissionConfig = {
  basis: {
    type: string;
    label: string;
  };
  defaultRatePct: number;
  tiers: TierConfig[];
  salespersonOverrides: Record<string, number>;
};

// Default configuration (same as admin)
const DEFAULT_CONFIG: CommissionConfig = {
  basis: {
    type: "gross_margin",
    label: LOCKED_BASIS_LABEL,
  },
  defaultRatePct: 10,
  tiers: [
    { minDays: 0, maxDays: 40, multiplierPct: 100 },
    { minDays: 41, maxDays: 60, multiplierPct: 75 },
    { minDays: 61, maxDays: 90, multiplierPct: 50 },
    { minDays: 91, maxDays: null, multiplierPct: 0 },
  ],
  salespersonOverrides: {},
};

// Mock commission events with invoice issue date, payment date, gross margin, salesperson
const MOCK_EVENTS = [
  {
    id: "EVT-001",
    invoiceId: "INV-2024-0001",
    customer: "Turner Construction",
    salesperson: "Jordan Miles",
    invoiceIssueDate: "2024-01-10",
    paymentDate: "2024-01-22",
    grossMargin: 12500.0,
    status: "Paid",
  },
  {
    id: "EVT-002",
    invoiceId: "INV-2024-0002",
    customer: "Skanska USA",
    salesperson: "Taylor Brooks",
    invoiceIssueDate: "2024-01-15",
    paymentDate: "2024-02-28",
    grossMargin: 8400.0,
    status: "Paid",
  },
  {
    id: "EVT-003",
    invoiceId: "INV-2024-0003",
    customer: "DPR Construction",
    salesperson: "Steve",
    invoiceIssueDate: "2024-02-01",
    paymentDate: "2024-02-12",
    grossMargin: 7200.0,
    status: "Paid",
  },
  {
    id: "EVT-004",
    invoiceId: "INV-2024-0004",
    customer: "Hensel Phelps",
    salesperson: "Jordan Miles",
    invoiceIssueDate: "2024-02-05",
    paymentDate: "2024-03-20",
    grossMargin: 14200.0,
    status: "Paid",
  },
  {
    id: "EVT-005",
    invoiceId: "INV-2024-0005",
    customer: "Holder Construction",
    salesperson: "Casey Rivera",
    invoiceIssueDate: "2024-02-10",
    paymentDate: "2024-02-20",
    grossMargin: 5100.0,
    status: "Paid",
  },
  {
    id: "EVT-006",
    invoiceId: "INV-2024-0006",
    customer: "McCarthy Building",
    salesperson: "Steve",
    invoiceIssueDate: "2024-01-20",
    paymentDate: "2024-05-15",
    grossMargin: 9800.0,
    status: "Paid",
  },
  {
    id: "EVT-007",
    invoiceId: "INV-2024-0007",
    customer: "Brasfield & Gorrie",
    salesperson: "Taylor Brooks",
    invoiceIssueDate: "2024-02-15",
    paymentDate: "2024-02-28",
    grossMargin: 6300.0,
    status: "Pending",
  },
  {
    id: "EVT-008",
    invoiceId: "INV-2024-0008",
    customer: "Whiting-Turner",
    salesperson: "Jordan Miles",
    invoiceIssueDate: "2024-02-20",
    paymentDate: "2024-03-05",
    grossMargin: 11200.0,
    status: "Pending",
  },
];

type FilterType = "all" | "pending" | "paid";

function loadConfig(): CommissionConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate structure
      if (
        parsed &&
        typeof parsed.defaultRatePct === "number" &&
        Array.isArray(parsed.tiers) &&
        parsed.basis &&
        typeof parsed.salespersonOverrides === "object"
      ) {
        return parsed as CommissionConfig;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_CONFIG;
}

// Calculate days between two date strings
function getDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Get tier multiplier for a given number of days
function getTierMultiplier(days: number, tiers: TierConfig[]): number {
  for (const tier of tiers) {
    const inMin = days >= tier.minDays;
    const inMax = tier.maxDays === null || days <= tier.maxDays;
    if (inMin && inMax) {
      return tier.multiplierPct;
    }
  }
  return 0;
}

// Get rate for a salesperson (override or default)
function getRateForSalesperson(
  salesperson: string,
  config: CommissionConfig
): number {
  // Check overrides (case-insensitive)
  for (const [name, pct] of Object.entries(config.salespersonOverrides)) {
    if (name.toLowerCase() === salesperson.toLowerCase()) {
      return pct;
    }
  }
  return config.defaultRatePct;
}

// Get Monday of the week for a given date (local time)
function getWeekMonday(dateStr: string): Date {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return monday;
}

// Generate week start key like "wk_2024_02_05"
function getWeekStartKey(dateStr: string): string {
  const monday = getWeekMonday(dateStr);
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const day = String(monday.getDate()).padStart(2, "0");
  return `wk_${year}_${month}_${day}`;
}

// Generate display label like "Week of Feb 5, 2024"
function getWeekDisplayLabel(weekKey: string): string {
  const parts = weekKey.split("_");
  const year = parseInt(parts[1], 10);
  const month = parseInt(parts[2], 10) - 1;
  const day = parseInt(parts[3], 10);
  const date = new Date(year, month, day);
  return `Week of ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

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
  const [config, setConfig] = useState<CommissionConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [salespersonFilter, setSalespersonFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("all");

  // Load config on mount
  useEffect(() => {
    const savedConfig = loadConfig();
    setConfig(savedConfig);
    setLoaded(true);
  }, []);

  // Compute commission data for each event
  const computedEvents = useMemo(() => {
    return MOCK_EVENTS.map((evt) => {
      const daysToPaid = getDaysBetween(evt.invoiceIssueDate, evt.paymentDate);
      const tierMultiplierPct = getTierMultiplier(daysToPaid, config.tiers);
      const ratePct = getRateForSalesperson(evt.salesperson, config);
      const earnedCommission =
        evt.grossMargin * (ratePct / 100) * (tierMultiplierPct / 100);

      return {
        ...evt,
        daysToPaid,
        tierMultiplierPct,
        ratePct,
        earnedCommission,
      };
    });
  }, [config]);

  // Unique salespeople
  const salespeople = useMemo(() => {
    const set = new Set(MOCK_EVENTS.map((e) => e.salesperson));
    return Array.from(set).sort();
  }, []);

  // Available weeks
  const availableWeeks = useMemo(() => {
    const weekSet = new Set<string>();
    MOCK_EVENTS.forEach((evt) => {
      weekSet.add(getWeekStartKey(evt.paymentDate));
    });
    return Array.from(weekSet).sort().reverse();
  }, []);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return computedEvents.filter((evt) => {
      const statusMatch =
        filter === "all" || evt.status.toLowerCase() === filter;
      const salespersonMatch =
        salespersonFilter === "all" || evt.salesperson === salespersonFilter;
      const weekMatch =
        weekFilter === "all" ||
        getWeekStartKey(evt.paymentDate) === weekFilter;
      return statusMatch && salespersonMatch && weekMatch;
    });
  }, [computedEvents, filter, salespersonFilter, weekFilter]);

  // Group by week
  const groupedByWeek = useMemo(() => {
    const groups: Record<string, typeof filteredEvents> = {};
    filteredEvents.forEach((evt) => {
      const key = getWeekStartKey(evt.paymentDate);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(evt);
    });
    const sortedKeys = Object.keys(groups).sort().reverse();
    return sortedKeys.map((key) => ({
      weekKey: key,
      label: getWeekDisplayLabel(key),
      events: groups[key],
      total: groups[key].reduce((sum, e) => sum + e.earnedCommission, 0),
    }));
  }, [filteredEvents]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const totals = useMemo(() => {
    const pending = filteredEvents
      .filter((e) => e.status === "Pending")
      .reduce((sum, e) => sum + e.earnedCommission, 0);
    const paid = filteredEvents
      .filter((e) => e.status === "Paid")
      .reduce((sum, e) => sum + e.earnedCommission, 0);
    return { pending, paid, total: pending + paid };
  }, [filteredEvents]);

  // Format overrides for display
  const overridesDisplay = useMemo(() => {
    const entries = Object.entries(config.salespersonOverrides);
    if (entries.length === 0) return "None";
    return entries.map(([name, pct]) => `${name}: ${pct}%`).join(", ");
  }, [config.salespersonOverrides]);

  if (!loaded) {
    return (
      <div className="commissions-container">
        <div className="loading">Loading commission data...</div>
        <style jsx>{`
          .commissions-container {
            padding: 24px 40px 60px;
            max-width: 1300px;
            margin: 0 auto;
          }
          .loading {
            color: rgba(255, 255, 255, 0.5);
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

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
            Weekly payable summaries computed from payment events using admin-configured rates.
          </p>
        </div>
      </div>

      {/* Config Info (Read-only) */}
      <div className="config-info-box">
        <div className="config-row">
          <span className="config-label">Basis:</span>
          <span className="config-value basis-label">{config.basis.label}</span>
        </div>
        <div className="config-row-inline">
          <div className="config-item">
            <span className="config-label">Default Rate:</span>
            <span className="config-value">{config.defaultRatePct}%</span>
          </div>
          <div className="config-item">
            <span className="config-label">Overrides:</span>
            <span className="config-value">{overridesDisplay}</span>
          </div>
          <Link href="/admin/commissions" className="config-edit-link">
            Edit in Admin →
          </Link>
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
        <div className="summary-card">
          <span className="card-label">Total (Filtered)</span>
          <span className="card-value total">{formatCurrency(totals.total)}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="controls-row">
        <div className="filters-left">
          <div className="filter-tabs">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "paid", label: "Paid" },
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
            {salespeople.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>

          <select
            className="week-select"
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
          >
            <option value="all">All Weeks</option>
            {availableWeeks.map((wk) => (
              <option key={wk} value={wk}>
                {getWeekDisplayLabel(wk)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Commission Events Grouped by Week */}
      {groupedByWeek.length > 0 ? (
        groupedByWeek.map((weekGroup) => (
          <div key={weekGroup.weekKey} className="week-section">
            <div className="week-header">
              <span className="week-label">{weekGroup.label}</span>
              <span className="week-total">{formatCurrency(weekGroup.total)}</span>
            </div>
            <div className="table-wrap">
              <table className="commissions-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Salesperson</th>
                    <th>Issue Date</th>
                    <th>Payment Date</th>
                    <th>Days-to-Paid</th>
                    <th>Tier %</th>
                    <th>Rate %</th>
                    <th>Gross Margin</th>
                    <th style={{ textAlign: "right" }}>Earned</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {weekGroup.events.map((evt) => (
                    <tr key={evt.id}>
                      <td className="cell-invoice">{evt.invoiceId}</td>
                      <td className="cell-customer">{evt.customer}</td>
                      <td className="cell-salesperson">{evt.salesperson}</td>
                      <td className="cell-date">{formatDate(evt.invoiceIssueDate)}</td>
                      <td className="cell-date">{formatDate(evt.paymentDate)}</td>
                      <td className="cell-days">
                        <span className="days-badge">{evt.daysToPaid} days</span>
                      </td>
                      <td className="cell-tier">
                        <span className={`tier-badge ${evt.tierMultiplierPct === 0 ? "zero" : ""}`}>
                          {evt.tierMultiplierPct}%
                        </span>
                      </td>
                      <td className="cell-rate">{evt.ratePct}%</td>
                      <td className="cell-gm">{formatCurrency(evt.grossMargin)}</td>
                      <td className={`cell-earned ${evt.earnedCommission === 0 ? "zero" : ""}`}>
                        {formatCurrency(evt.earnedCommission)}
                      </td>
                      <td className="cell-status">
                        <StatusBadge status={evt.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <div className="table-wrap">
          <div className="empty-state">
            No commission events match the selected filters.
          </div>
        </div>
      )}

      {/* Explainer Note */}
      <div className="explainer">
        <span className="explainer-icon">i</span>
        <span>
          <strong>Formula:</strong> Earned = Gross Margin × Rate% × Tier Multiplier%.
          Tier multipliers are determined by days-to-paid. Rates come from admin settings or salesperson overrides.
        </span>
      </div>

      <style jsx>{`
        .commissions-container {
          padding: 24px 40px 60px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 20px;
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

        /* Config Info Box (Read-only) */
        .config-info-box {
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .config-row {
          margin-bottom: 12px;
        }

        .config-row-inline {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .config-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .config-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .config-value {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          font-weight: 500;
        }

        .config-value.basis-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 400;
          line-height: 1.4;
        }

        .config-edit-link {
          margin-left: auto;
          font-size: 12px;
          color: rgba(59, 130, 246, 0.8);
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .config-edit-link:hover {
          color: #3b82f6;
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

        .card-value.total {
          color: #3b82f6;
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
          flex-wrap: wrap;
        }

        .filter-tabs {
          display: flex;
          gap: 8px;
        }

        .salesperson-select,
        .week-select {
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

        .salesperson-select:hover,
        .week-select:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }

        .salesperson-select:focus,
        .week-select:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.5);
        }

        .salesperson-select option,
        .week-select option {
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

        /* Week Section */
        .week-section {
          margin-bottom: 24px;
        }

        .week-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.15);
          border-radius: 8px 8px 0 0;
        }

        .week-label {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .week-total {
          font-size: 15px;
          font-weight: 700;
          font-family: var(--font-geist-mono), monospace;
          color: #3b82f6;
        }

        .week-section .table-wrap {
          border-top: none;
          border-radius: 0 0 12px 12px;
        }

        /* Table */
        .table-wrap {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          overflow-x: auto;
        }

        .commissions-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1100px;
        }

        .commissions-table thead {
          background: rgba(255, 255, 255, 0.03);
        }

        .commissions-table th {
          padding: 14px 12px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          white-space: nowrap;
        }

        .commissions-table td {
          padding: 12px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .commissions-table tr:last-child td {
          border-bottom: none;
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
          font-size: 12px;
        }

        .days-badge {
          font-size: 11px;
          padding: 3px 8px;
          background: rgba(148, 163, 184, 0.12);
          color: rgba(148, 163, 184, 0.9);
          border-radius: 4px;
          font-family: var(--font-geist-mono), monospace;
        }

        .tier-badge {
          font-size: 11px;
          padding: 3px 8px;
          background: rgba(34, 197, 94, 0.12);
          color: #22c55e;
          border-radius: 4px;
          font-family: var(--font-geist-mono), monospace;
          font-weight: 600;
        }

        .tier-badge.zero {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }

        .cell-rate {
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .cell-gm {
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .cell-earned {
          text-align: right;
          font-family: var(--font-geist-mono), monospace;
          font-weight: 600;
          color: #22c55e;
        }

        .cell-earned.zero {
          color: rgba(255, 255, 255, 0.3);
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

        .explainer strong {
          color: rgba(255, 255, 255, 0.7);
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
