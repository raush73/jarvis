"use client";

import { useRouter, useParams } from "next/navigation";

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
      `}</style>
    </div>
  );
}
