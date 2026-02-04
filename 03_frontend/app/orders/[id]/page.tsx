"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";

// ============================================================
// MOCKED BURDEN MODEL v1.0 — UI SHELL ONLY
// ============================================================
// Orders own standard costs; quotes may populate them; invoices consume but never calculate.
// ============================================================

const MOCK_STATES = ["KY", "TN", "IN", "OH", "TX", "CA", "FL", "GA", "NC", "PA", "IL", "MI"] as const;
const MOCK_TRADES = ["Millwright", "Welder", "Pipefitter", "Electrician", "Crane Operator", "Ironworker"] as const;

// Mock global burden rates (Burden Model v1.0)
const MOCK_GLOBAL_BURDENS = {
  fica: 7.65,
  futa: 0.6,
  admin: 2.5,
  gl: 1.5,
  bank: 0.75,
};

// Mock SUTA rates by state
const MOCK_SUTA: Record<string, number> = {
  KY: 2.7, TN: 2.5, IN: 2.5, OH: 2.7, TX: 2.7, CA: 3.4,
  FL: 2.7, GA: 2.64, NC: 1.0, PA: 3.6, IL: 3.175, MI: 2.7,
};

// Mock WC rates by State×Trade
const MOCK_WC: Record<string, Record<string, number>> = {
  KY: { Millwright: 4.25, Welder: 5.10, Pipefitter: 4.75, Electrician: 3.85, "Crane Operator": 5.50, Ironworker: 6.20 },
  TN: { Millwright: 3.90, Welder: 4.65, Pipefitter: 4.30, Electrician: 3.50, "Crane Operator": 5.20, Ironworker: 5.80 },
  IN: { Millwright: 4.00, Welder: 4.85, Pipefitter: 4.50, Electrician: 3.65, "Crane Operator": 5.30, Ironworker: 5.90 },
  OH: { Millwright: 4.40, Welder: 5.25, Pipefitter: 4.90, Electrician: 3.95, "Crane Operator": 5.60, Ironworker: 6.40 },
  TX: { Millwright: 3.80, Welder: 4.55, Pipefitter: 4.20, Electrician: 3.40, "Crane Operator": 5.00, Ironworker: 5.60 },
  CA: { Millwright: 5.00, Welder: 5.80, Pipefitter: 5.40, Electrician: 4.50, "Crane Operator": 6.20, Ironworker: 7.00 },
  FL: { Millwright: 3.70, Welder: 4.45, Pipefitter: 4.10, Electrician: 3.30, "Crane Operator": 4.90, Ironworker: 5.50 },
  GA: { Millwright: 3.85, Welder: 4.60, Pipefitter: 4.25, Electrician: 3.45, "Crane Operator": 5.10, Ironworker: 5.70 },
  NC: { Millwright: 3.75, Welder: 4.50, Pipefitter: 4.15, Electrician: 3.35, "Crane Operator": 4.95, Ironworker: 5.55 },
  PA: { Millwright: 4.60, Welder: 5.45, Pipefitter: 5.10, Electrician: 4.15, "Crane Operator": 5.80, Ironworker: 6.60 },
  IL: { Millwright: 4.30, Welder: 5.15, Pipefitter: 4.80, Electrician: 3.90, "Crane Operator": 5.50, Ironworker: 6.30 },
  MI: { Millwright: 4.20, Welder: 5.05, Pipefitter: 4.70, Electrician: 3.80, "Crane Operator": 5.40, Ironworker: 6.10 },
};

// Mock order detail data
const MOCK_ORDER_DETAILS: Record<string, {
  id: string;
  customer: string;
  site: string;
  address: string;
  startDate: string;
  endDate: string;
  status: string;
  salesperson: { name: string };
  pmContact: { name: string; email: string; office: string; cell: string };
  trades: Array<{ trade: string; open: number; total: number }>;
  tools: string[];
  ppe: string[];
  dispatchChecklist: Array<{ item: string; done: boolean }>;
  auditLog: Array<{ action: string; user: string; time: string }>;
}> = {
  "ORD-2024-001": {
    id: "ORD-2024-001",
    customer: "Turner Construction",
    site: "Downtown Tower",
    address: "450 S Grand Ave, Los Angeles, CA 90071",
    startDate: "2024-02-15",
    endDate: "2024-08-30",
    status: "Active",
    salesperson: {
      name: "Jordan Miles",
    },
    pmContact: {
      name: "Casey Rivers",
      email: "pm@example.com",
      office: "(000) 000-0000",
      cell: "(000) 000-0000",
    },
    trades: [
      { trade: "Millwright", open: 3, total: 10 },
      { trade: "Pipefitter/Welder", open: 12, total: 30 },
      { trade: "Electrician", open: 2, total: 8 },
      { trade: "Iron Worker", open: 0, total: 5 },
    ],
    tools: ["Torque Wrenches", "Dial Indicators", "Laser Alignment Kit", "Rigging Equipment"],
    ppe: ["Hard Hat", "Safety Glasses", "Steel-Toe Boots", "Hi-Vis Vest", "Gloves"],
    dispatchChecklist: [
      { item: "Safety orientation completed", done: true },
      { item: "Background check cleared", done: true },
      { item: "Drug screening passed", done: true },
      { item: "Site credentials issued", done: false },
      { item: "Tool allocation confirmed", done: false },
    ],
    auditLog: [
      { action: "Trade request updated", user: "M. Rodriguez", time: "2 hours ago" },
      { action: "Contact info modified", user: "S. Mitchell", time: "1 day ago" },
      { action: "Order created", user: "System", time: "Jan 28, 2024" },
    ],
  },
};

// Default fallback for any order ID
const DEFAULT_ORDER = {
  id: "ORD-XXXX-XXX",
  customer: "Sample Customer",
  site: "Sample Site",
  address: "123 Main St, City, ST 00000",
  startDate: "2024-03-01",
  endDate: "2024-09-30",
  status: "Active",
  salesperson: {
    name: "Jordan Miles",
  },
  pmContact: {
    name: "Casey Rivers",
    email: "pm@example.com",
    office: "(000) 000-0000",
    cell: "(000) 000-0000",
  },
  trades: [
    { trade: "Millwright", open: 5, total: 10 },
    { trade: "Pipefitter/Welder", open: 10, total: 20 },
  ],
  tools: ["Standard Tool Kit", "Safety Equipment"],
  ppe: ["Hard Hat", "Safety Glasses", "Steel-Toe Boots"],
  dispatchChecklist: [
    { item: "Safety orientation completed", done: false },
    { item: "Background check cleared", done: false },
    { item: "Drug screening passed", done: false },
  ],
  auditLog: [
    { action: "Order created", user: "System", time: "Recently" },
  ],
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  // Get order data or use default
  const order = MOCK_ORDER_DETAILS[orderId] || { ...DEFAULT_ORDER, id: orderId };

  // ============================================================
  // LABOR COST ASSUMPTIONS STATE (UI shell — Order-owned standard cost)
  // ============================================================
  const [laborState, setLaborState] = useState<string>("");
  const [laborTrade, setLaborTrade] = useState<string>("");
  const [basePayRate, setBasePayRate] = useState<string>("");

  // Planned Hours Mix state
  const [plannedRegHours, setPlannedRegHours] = useState<string>("");
  const [plannedOtHours, setPlannedOtHours] = useState<string>("");
  const [plannedDtHours, setPlannedDtHours] = useState<string>("");

  // Compute REG/OT/DT cost per hour (mocked v1.0 burden model)
  const laborCostResult = useMemo(() => {
    if (!laborState || !laborTrade || !basePayRate) return null;

    const payRate = parseFloat(basePayRate);
    if (isNaN(payRate) || payRate <= 0) return null;

    // Get rates from mocks
    const sutaPct = MOCK_SUTA[laborState] ?? 2.7;
    const wcPct = MOCK_WC[laborState]?.[laborTrade] ?? 4.0;
    const globalBurdenPct =
      MOCK_GLOBAL_BURDENS.fica +
      MOCK_GLOBAL_BURDENS.futa +
      MOCK_GLOBAL_BURDENS.admin +
      MOCK_GLOBAL_BURDENS.gl +
      MOCK_GLOBAL_BURDENS.bank;

    // Total-wage burden (follows OT/DT premium): FICA + FUTA + SUTA + Admin + GL + Bank
    const totalWageBurdenPct = globalBurdenPct + sutaPct;

    // v1.0 Burden Formulas:
    // - WC does NOT follow OT/DT premium (base wage only)
    // - All other burdens DO follow OT/DT premium
    // REG = payRate * (1 + totalWageBurden% + WC%)
    // OT  = (payRate * 1.5) * (1 + totalWageBurden%) + (payRate * WC%)
    // DT  = (payRate * 2.0) * (1 + totalWageBurden%) + (payRate * WC%)
    const totalWageFactor = 1 + totalWageBurdenPct / 100;
    const wcFactor = wcPct / 100;

    const regCostPerHour = payRate * (totalWageFactor + wcFactor);
    const otCostPerHour = payRate * 1.5 * totalWageFactor + payRate * wcFactor;
    const dtCostPerHour = payRate * 2.0 * totalWageFactor + payRate * wcFactor;

    return {
      regCostPerHour,
      otCostPerHour,
      dtCostPerHour,
      totalWageBurdenPct,
      wcPct,
    };
  }, [laborState, laborTrade, basePayRate]);

  // Compute Standard Labor Cost Rollup
  const rollupResult = useMemo(() => {
    if (!laborCostResult) return null;

    const regHrs = parseFloat(plannedRegHours) || 0;
    const otHrs = parseFloat(plannedOtHours) || 0;
    const dtHrs = parseFloat(plannedDtHours) || 0;

    const regExtended = regHrs * laborCostResult.regCostPerHour;
    const otExtended = otHrs * laborCostResult.otCostPerHour;
    const dtExtended = dtHrs * laborCostResult.dtCostPerHour;
    const totalStandardLaborCost = regExtended + otExtended + dtExtended;

    return {
      regHrs,
      otHrs,
      dtHrs,
      regExtended,
      otExtended,
      dtExtended,
      totalStandardLaborCost,
    };
  }, [laborCostResult, plannedRegHours, plannedOtHours, plannedDtHours]);

  // Format currency helper
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const handleLogout = () => {
    router.push("/login");
  };

  const handleBackToOrders = () => {
    router.push("/orders");
  };

  const totalOpen = order.trades.reduce((sum, t) => sum + t.open, 0);
  const totalRequired = order.trades.reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="order-detail-page">
      <div className="order-detail-container">
      {/* Page Header */}
      <div className="detail-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleBackToOrders}>
            ← Back to Orders
          </button>
          <div className="header-title">
            <h1>{order.id}</h1>
            <span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span>
            <span className="health-badge">Order Health: Coming soon</span>
          </div>
        </div>
        <div className="header-right">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="detail-grid">
        {/* Header Summary Section */}
        <section className="detail-section summary-section">
          <h2>Order Summary</h2>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Customer</span>
              <span className="value">{order.customer}</span>
            </div>
            <div className="summary-item">
              <span className="label">Site</span>
              <span className="value">{order.site}</span>
            </div>
            <div className="summary-item">
              <span className="label">Start Date</span>
              <span className="value">{new Date(order.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="summary-item">
              <span className="label">End Date</span>
              <span className="value">{new Date(order.endDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
        </section>

        {/* Ownership & Contact */}
        <section className="detail-section">
          <h2>Ownership &amp; Contact</h2>
          <div className="ownership-grid">
            <div className="ownership-card salesperson-card">
              <div className="ownership-header">
                <span className="ownership-type">Salesperson</span>
                <span className="read-only-badge">Read-only</span>
              </div>
              <span className="ownership-name">{order.salesperson.name}</span>
            </div>
            <div className="ownership-card pm-card">
              <div className="ownership-header">
                <span className="ownership-type">Project Manager (PM)</span>
              </div>
              <span className="ownership-name">{order.pmContact.name}</span>
              <div className="pm-contact-details">
                <div className="contact-row">
                  <span className="contact-label">Email:</span>
                  <span className="contact-value">{order.pmContact.email}</span>
                </div>
                <div className="contact-row">
                  <span className="contact-label">Office:</span>
                  <span className="contact-value">{order.pmContact.office}</span>
                </div>
                <div className="contact-row">
                  <span className="contact-label">Cell:</span>
                  <span className="contact-value">{order.pmContact.cell}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* LABOR COST ASSUMPTIONS (Standard Cost) — Order-owned */}
        {/* ============================================================ */}
        <section className="detail-section labor-cost-section">
          <h2>Labor Cost Assumptions (Standard Cost)</h2>
          <div className="shell-notice">
            <span className="shell-icon">⚠</span>
            <span>Standard cost derived from Burden Model v1.0 (UI shell — mocked).</span>
          </div>
          <p className="section-note">
            Orders own standard costs; quotes may populate them; invoices consume but never calculate.
          </p>

          <div className="labor-inputs-grid">
            <div className="labor-input-field">
              <label htmlFor="laborStateSelect">State</label>
              <select
                id="laborStateSelect"
                value={laborState}
                onChange={(e) => setLaborState(e.target.value)}
              >
                <option value="">Select State</option>
                {MOCK_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="labor-input-field">
              <label htmlFor="laborTradeSelect">Trade</label>
              <select
                id="laborTradeSelect"
                value={laborTrade}
                onChange={(e) => setLaborTrade(e.target.value)}
              >
                <option value="">Select Trade</option>
                {MOCK_TRADES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="labor-input-field">
              <label htmlFor="basePayRateInput">Base Pay Rate ($/hr)</label>
              <input
                id="basePayRateInput"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 35.00"
                value={basePayRate}
                onChange={(e) => setBasePayRate(e.target.value)}
              />
            </div>
          </div>

          {/* Derived REG/OT/DT Cost Per Hour — Read-only outputs */}
          <div className="cost-outputs-section">
            <h3>Cost Per Hour (Burdened) — Read-only</h3>
            {laborCostResult ? (
              <div className="cost-cards-grid">
                <div className="cost-card reg">
                  <div className="cost-label">REG Cost / Hour</div>
                  <div className="cost-value">{formatCurrency(laborCostResult.regCostPerHour)}</div>
                </div>
                <div className="cost-card ot">
                  <div className="cost-label">OT Cost / Hour</div>
                  <div className="cost-value">{formatCurrency(laborCostResult.otCostPerHour)}</div>
                </div>
                <div className="cost-card dt">
                  <div className="cost-label">DT Cost / Hour</div>
                  <div className="cost-value">{formatCurrency(laborCostResult.dtCostPerHour)}</div>
                </div>
              </div>
            ) : (
              <div className="cost-placeholder">
                Select State, Trade, and enter Pay Rate to see burdened cost per hour
              </div>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* PLANNED HOURS MIX */}
        {/* ============================================================ */}
        <section className="detail-section planned-hours-section">
          <h2>Planned Hours Mix</h2>
          <div className="hours-inputs-grid">
            <div className="hours-input-field">
              <label htmlFor="plannedRegHoursInput">Planned REG Hours</label>
              <input
                id="plannedRegHoursInput"
                type="number"
                step="0.5"
                min="0"
                placeholder="0"
                value={plannedRegHours}
                onChange={(e) => setPlannedRegHours(e.target.value)}
              />
            </div>

            <div className="hours-input-field">
              <label htmlFor="plannedOtHoursInput">Planned OT Hours</label>
              <input
                id="plannedOtHoursInput"
                type="number"
                step="0.5"
                min="0"
                placeholder="0"
                value={plannedOtHours}
                onChange={(e) => setPlannedOtHours(e.target.value)}
              />
            </div>

            <div className="hours-input-field">
              <label htmlFor="plannedDtHoursInput">Planned DT Hours</label>
              <input
                id="plannedDtHoursInput"
                type="number"
                step="0.5"
                min="0"
                placeholder="0"
                value={plannedDtHours}
                onChange={(e) => setPlannedDtHours(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* STANDARD LABOR COST ROLLUP */}
        {/* ============================================================ */}
        <section className="detail-section rollup-section">
          <h2>Standard Labor Cost Rollup</h2>
          <p className="section-note">Mocked standard cost preview (UI shell).</p>

          {rollupResult && laborCostResult ? (
            <>
              <div className="rollup-table">
                <div className="rollup-header">
                  <span className="rollup-col-type">Type</span>
                  <span className="rollup-col-hours">Hours</span>
                  <span className="rollup-col-rate">Rate/Hr</span>
                  <span className="rollup-col-extended">Extended Cost</span>
                </div>

                <div className="rollup-row reg-row">
                  <span className="rollup-col-type">REG</span>
                  <span className="rollup-col-hours">{rollupResult.regHrs.toFixed(1)}</span>
                  <span className="rollup-col-rate">{formatCurrency(laborCostResult.regCostPerHour)}</span>
                  <span className="rollup-col-extended">{formatCurrency(rollupResult.regExtended)}</span>
                </div>

                <div className="rollup-row ot-row">
                  <span className="rollup-col-type">OT</span>
                  <span className="rollup-col-hours">{rollupResult.otHrs.toFixed(1)}</span>
                  <span className="rollup-col-rate">{formatCurrency(laborCostResult.otCostPerHour)}</span>
                  <span className="rollup-col-extended">{formatCurrency(rollupResult.otExtended)}</span>
                </div>

                <div className="rollup-row dt-row">
                  <span className="rollup-col-type">DT</span>
                  <span className="rollup-col-hours">{rollupResult.dtHrs.toFixed(1)}</span>
                  <span className="rollup-col-rate">{formatCurrency(laborCostResult.dtCostPerHour)}</span>
                  <span className="rollup-col-extended">{formatCurrency(rollupResult.dtExtended)}</span>
                </div>

                <div className="rollup-total-row">
                  <span className="rollup-col-type">Total Standard Labor Cost</span>
                  <span className="rollup-col-hours">{(rollupResult.regHrs + rollupResult.otHrs + rollupResult.dtHrs).toFixed(1)}</span>
                  <span className="rollup-col-rate">—</span>
                  <span className="rollup-col-extended total-value">{formatCurrency(rollupResult.totalStandardLaborCost)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="rollup-placeholder">
              Complete Labor Cost Assumptions to see rollup calculations
            </div>
          )}
        </section>

        {/* Trade Requirements */}
        <section className="detail-section">
          <h2>Trade Requirements</h2>
          <div className="trades-overview">
            <div className="trades-stat">
              <span className="stat-value">{totalOpen}</span>
              <span className="stat-label">Open Positions</span>
            </div>
            <div className="trades-stat">
              <span className="stat-value">{totalRequired}</span>
              <span className="stat-label">Total Required</span>
            </div>
          </div>
          <div className="trades-list">
            {order.trades.map((trade) => {
              const filled = trade.total - trade.open;
              const pct = trade.total > 0 ? (filled / trade.total) * 100 : 0;
              return (
                <div className="trade-row" key={trade.trade}>
                  <span className="trade-name">{trade.trade}</span>
                  <div className="trade-bar-wrap">
                    <div className="trade-bar" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="trade-nums">{filled} / {trade.total}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tools & PPE */}
        <section className="detail-section half-section">
          <h2>Tools Required</h2>
          <ul className="item-list">
            {order.tools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        </section>

        <section className="detail-section half-section">
          <h2>PPE Requirements</h2>
          <ul className="item-list">
            {order.ppe.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {/* Dispatch Readiness Checklist */}
        <section className="detail-section">
          <h2>Dispatch Readiness Checklist</h2>
          <ul className="checklist">
            {order.dispatchChecklist.map((check, idx) => (
              <li key={idx} className={check.done ? "done" : ""}>
                <span className="check-icon">{check.done ? "✓" : "○"}</span>
                <span className="check-text">{check.item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Audit / Activity Log */}
        <section className="detail-section">
          <h2>Activity Log</h2>
          <ul className="audit-log">
            {order.auditLog.map((entry, idx) => (
              <li key={idx}>
                <span className="audit-action">{entry.action}</span>
                <span className="audit-meta">{entry.user} • {entry.time}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      </div>
      <style jsx>{`
        .order-detail-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #0c0f14 0%, #111827 100%);
        }

        .order-detail-container {
          padding: 24px 40px 60px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .detail-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .back-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s ease;
        }

        .back-btn:hover {
          color: #3b82f6;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .header-title h1 {
          font-size: 28px;
          font-weight: 600;
          color: #fff;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .status-badge {
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.active {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .health-badge {
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 500;
          border-radius: 6px;
          background: rgba(148, 163, 184, 0.15);
          color: rgba(148, 163, 184, 0.8);
          border: 1px dashed rgba(148, 163, 184, 0.3);
        }

        .header-right {
          display: flex;
          gap: 12px;
        }

        .logout-btn {
          padding: 8px 18px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #f87171;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .detail-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 24px;
        }

        .detail-section.summary-section,
        .detail-section:nth-child(2),
        .detail-section:nth-child(3),
        .detail-section:nth-child(6),
        .detail-section:nth-child(7) {
          grid-column: span 2;
        }

        .detail-section.half-section {
          grid-column: span 1;
        }

        .detail-section h2 {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 18px;
        }

        /* Summary Grid */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .summary-item .label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
        }

        .summary-item .value {
          font-size: 15px;
          color: #fff;
          font-weight: 500;
        }

        /* Ownership Grid */
        .ownership-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .ownership-card {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          padding: 18px;
        }

        .ownership-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .ownership-type {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .read-only-badge {
          font-size: 9px;
          padding: 2px 6px;
          background: rgba(148, 163, 184, 0.15);
          color: rgba(148, 163, 184, 0.8);
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .ownership-name {
          font-size: 17px;
          font-weight: 600;
          color: #fff;
          display: block;
        }

        .salesperson-card {
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .pm-card {
          border: 1px solid rgba(59, 130, 246, 0.2);
          background: rgba(59, 130, 246, 0.05);
        }

        .pm-contact-details {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .contact-row {
          display: flex;
          gap: 8px;
          font-size: 13px;
        }

        .contact-label {
          color: rgba(255, 255, 255, 0.45);
          min-width: 50px;
        }

        .contact-value {
          color: rgba(255, 255, 255, 0.85);
        }

        /* Trades */
        .trades-overview {
          display: flex;
          gap: 40px;
          margin-bottom: 20px;
        }

        .trades-stat {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #fff;
          line-height: 1;
        }

        .stat-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
          margin-top: 4px;
        }

        .trades-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .trade-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .trade-name {
          width: 160px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
        }

        .trade-bar-wrap {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          overflow: hidden;
        }

        .trade-bar {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #22c55e 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .trade-nums {
          width: 60px;
          text-align: right;
          font-size: 13px;
          font-family: var(--font-geist-mono), monospace;
          color: rgba(255, 255, 255, 0.6);
        }

        /* Item Lists */
        .item-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .item-list li {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.75);
          padding-left: 18px;
          position: relative;
        }

        .item-list li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #3b82f6;
        }

        /* Checklist */
        .checklist {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .checklist li {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        .checklist li.done {
          color: rgba(255, 255, 255, 0.85);
        }

        .check-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 12px;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.3);
        }

        .checklist li.done .check-icon {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        /* Audit Log */
        .audit-log {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .audit-log li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 6px;
        }

        .audit-action {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
        }

        .audit-meta {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        /* ============================================================ */
        /* LABOR COST ASSUMPTIONS SECTION STYLES */
        /* ============================================================ */
        .labor-cost-section,
        .planned-hours-section,
        .rollup-section {
          grid-column: span 2;
        }

        .shell-notice {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(139, 92, 246, 0.08);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          margin-bottom: 12px;
          font-size: 12px;
          color: #a78bfa;
        }

        .shell-icon {
          font-size: 14px;
        }

        .section-note {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
          margin: 0 0 16px;
          font-style: italic;
        }

        .labor-inputs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .labor-input-field,
        .hours-input-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .labor-input-field label,
        .hours-input-field label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .labor-input-field select,
        .labor-input-field input,
        .hours-input-field input {
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-size: 14px;
          color: #fff;
        }

        .labor-input-field select:focus,
        .labor-input-field input:focus,
        .hours-input-field input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .labor-input-field select option {
          background: #1a1d24;
          color: #fff;
        }

        .labor-input-field input::placeholder,
        .hours-input-field input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }

        /* Cost Outputs Section */
        .cost-outputs-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .cost-outputs-section h3 {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 14px;
        }

        .cost-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .cost-card {
          padding: 18px;
          border-radius: 10px;
          text-align: center;
        }

        .cost-card.reg {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.25);
        }

        .cost-card.ot {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.25);
        }

        .cost-card.dt {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
        }

        .cost-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .cost-card.reg .cost-label {
          color: #3b82f6;
        }

        .cost-card.ot .cost-label {
          color: #f59e0b;
        }

        .cost-card.dt .cost-label {
          color: #ef4444;
        }

        .cost-value {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          font-family: var(--font-geist-mono), monospace;
        }

        .cost-placeholder,
        .rollup-placeholder {
          padding: 32px 24px;
          text-align: center;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
        }

        /* Planned Hours Section */
        .hours-inputs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        /* Rollup Section */
        .rollup-table {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          overflow: hidden;
        }

        .rollup-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .rollup-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          padding: 14px 16px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .rollup-row.reg-row {
          border-left: 3px solid #3b82f6;
        }

        .rollup-row.ot-row {
          border-left: 3px solid #f59e0b;
        }

        .rollup-row.dt-row {
          border-left: 3px solid #ef4444;
        }

        .rollup-total-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          padding: 16px;
          background: rgba(34, 197, 94, 0.08);
          border-top: 1px solid rgba(34, 197, 94, 0.2);
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }

        .rollup-col-type {
          font-weight: 500;
        }

        .rollup-col-hours,
        .rollup-col-rate,
        .rollup-col-extended {
          text-align: right;
          font-family: var(--font-geist-mono), monospace;
        }

        .total-value {
          color: #22c55e;
          font-size: 16px;
          font-weight: 700;
        }

        /* Responsive adjustments for labor sections */
        @media (max-width: 768px) {
          .labor-inputs-grid,
          .cost-cards-grid,
          .hours-inputs-grid {
            grid-template-columns: 1fr;
          }

          .rollup-header,
          .rollup-row,
          .rollup-total-row {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          .rollup-col-rate {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
