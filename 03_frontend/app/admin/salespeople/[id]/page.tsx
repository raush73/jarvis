"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Types
type SalespersonStatus = "Active" | "Inactive";

type Salesperson = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: SalespersonStatus;
  defaultCommissionPlan: string;
  defaultOnNewCustomers: boolean;
  createdAt: string;
  updatedAt: string;
};

type CustomerOwned = {
  id: string;
  name: string;
  state: string;
  openOrders: number;
  lastOrder: string;
};

// Mock data
const MOCK_SALESPEOPLE: Record<string, Salesperson> = {
  "SLP-001": {
    id: "SLP-001",
    name: "Steve Mitchell",
    email: "steve.mitchell@mw4h.com",
    phone: "(555) 234-5678",
    status: "Active",
    defaultCommissionPlan: "Standard Tier",
    defaultOnNewCustomers: true,
    createdAt: "2024-03-15",
    updatedAt: "2026-01-28",
  },
  "SLP-002": {
    id: "SLP-002",
    name: "David Park",
    email: "david.park@mw4h.com",
    phone: "(555) 345-6789",
    status: "Active",
    defaultCommissionPlan: "Standard Tier",
    defaultOnNewCustomers: false,
    createdAt: "2025-01-05",
    updatedAt: "2026-01-20",
  },
  "SLP-003": {
    id: "SLP-003",
    name: "Lisa Hernandez",
    email: "lisa.hernandez@mw4h.com",
    phone: "(555) 456-7890",
    status: "Inactive",
    defaultCommissionPlan: "Standard Tier",
    defaultOnNewCustomers: false,
    createdAt: "2024-05-22",
    updatedAt: "2025-12-01",
  },
  "SLP-004": {
    id: "SLP-004",
    name: "Marcus Chen",
    email: "marcus.chen@mw4h.com",
    phone: "(555) 567-8901",
    status: "Active",
    defaultCommissionPlan: "Senior Tier",
    defaultOnNewCustomers: true,
    createdAt: "2024-08-20",
    updatedAt: "2026-01-15",
  },
};

const MOCK_CUSTOMERS_OWNED: CustomerOwned[] = [
  { id: "CUST-001", name: "Acme Construction", state: "TX", openOrders: 3, lastOrder: "2026-02-08" },
  { id: "CUST-002", name: "BuildRight Inc", state: "TX", openOrders: 1, lastOrder: "2026-02-05" },
  { id: "CUST-003", name: "Metro Builders", state: "CA", openOrders: 2, lastOrder: "2026-02-01" },
  { id: "CUST-004", name: "Summit Contractors", state: "FL", openOrders: 0, lastOrder: "2026-01-20" },
  { id: "CUST-005", name: "Precision Plumbing", state: "TX", openOrders: 1, lastOrder: "2026-01-28" },
];

export default function SalespersonDetailPage() {
  const params = useParams();
  const salespersonId = params.id as string;

  // Get salesperson data (fallback to first mock if not found)
  const salesperson = MOCK_SALESPEOPLE[salespersonId] || MOCK_SALESPEOPLE["SLP-001"];

  // UI-only toggle state
  const [defaultOnNew, setDefaultOnNew] = useState(salesperson.defaultOnNewCustomers);

  // Status badge style
  const getStatusStyle = (status: SalespersonStatus) => {
    if (status === "Active") {
      return { bg: "rgba(34, 197, 94, 0.12)", color: "#22c55e", border: "rgba(34, 197, 94, 0.25)" };
    }
    return { bg: "rgba(107, 114, 128, 0.12)", color: "#6b7280", border: "rgba(107, 114, 128, 0.25)" };
  };

  return (
    <div className="detail-container">
      {/* UI Shell Banner */}
      <div className="shell-banner">
        UI shell (mocked) — Internal management view — not visible to Sales roles.
      </div>

      {/* Header */}
      <div className="page-header">
        <Link href="/admin/salespeople" className="back-link">
          ← Back to Salespeople
        </Link>
        <h1>Salesperson Detail</h1>
        <p className="subtitle">
          View and manage salesperson profile and customer assignments.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Basic Info Card */}
        <div className="card">
          <div className="card-header">
            <h2>Basic Information</h2>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">Name</span>
              <span className="info-value">{salesperson.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value email">{salesperson.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Phone</span>
              <span className="info-value">{salesperson.phone}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status</span>
              <span className="info-value">
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: getStatusStyle(salesperson.status).bg,
                    color: getStatusStyle(salesperson.status).color,
                    borderColor: getStatusStyle(salesperson.status).border,
                  }}
                >
                  {salesperson.status}
                </span>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">ID</span>
              <span className="info-value mono">{salesperson.id}</span>
            </div>
          </div>
        </div>

        {/* Defaults Card */}
        <div className="card">
          <div className="card-header">
            <h2>Defaults</h2>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">Default Commission Plan</span>
              <span className="info-value">{salesperson.defaultCommissionPlan}</span>
            </div>
            <div className="info-row toggle-row">
              <span className="info-label">Default on New Customers</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={defaultOnNew}
                  onChange={() => setDefaultOnNew(!defaultOnNew)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-hint">(UI only)</span>
            </div>
          </div>
          <div className="card-footer">
            <span className="audit-text">Created: {salesperson.createdAt}</span>
            <span className="audit-text">Updated: {salesperson.updatedAt}</span>
          </div>
        </div>
      </div>

      {/* Customers Owned Section */}
      <div className="section">
        <div className="section-header">
          <h2>Customers Owned</h2>
          <span className="section-count">{MOCK_CUSTOMERS_OWNED.length} customers</span>
        </div>
        <div className="table-section">
          <div className="table-wrap">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>State</th>
                  <th>Open Orders</th>
                  <th>Last Order</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CUSTOMERS_OWNED.map((cust) => (
                  <tr key={cust.id}>
                    <td className="cell-name">{cust.name}</td>
                    <td className="cell-state">{cust.state}</td>
                    <td className="cell-orders">{cust.openOrders}</td>
                    <td className="cell-date">{cust.lastOrder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Commission Snapshot Placeholder */}
      <div className="section">
        <div className="section-header">
          <h2>Commission Snapshot</h2>
          <span className="badge-future">FUTURE</span>
        </div>
        <div className="placeholder-panel">
          <div className="placeholder-icon">📊</div>
          <div className="placeholder-text">
            Commission history and earnings summary will appear here once wired to backend data.
          </div>
          <div className="placeholder-note">
            Powered by approved snapshots (future wiring).
          </div>
        </div>
      </div>

      <style jsx>{`
        .detail-container {
          padding: 24px 40px 60px;
          max-width: 1000px;
          margin: 0 auto;
        }

        /* Shell Banner */
        .shell-banner {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 12px;
          font-weight: 500;
          color: #f59e0b;
          text-align: center;
          margin-bottom: 24px;
        }

        /* Header */
        .page-header {
          margin-bottom: 28px;
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
          font-size: 28px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }

        .subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.55);
          margin: 0;
        }

        /* Content Grid */
        .content-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 28px;
        }

        /* Cards */
        .card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          overflow: hidden;
        }

        .card-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .card-header h2 {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .card-body {
          padding: 20px;
        }

        .card-footer {
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          display: flex;
          gap: 20px;
        }

        .audit-text {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .info-value {
          font-size: 13px;
          color: #fff;
          font-weight: 500;
        }

        .info-value.email {
          color: rgba(255, 255, 255, 0.7);
          font-weight: 400;
        }

        .info-value.mono {
          font-family: monospace;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          border-radius: 4px;
          border: 1px solid;
        }

        /* Toggle */
        .toggle-row {
          gap: 12px;
        }

        .toggle {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }

        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          transition: 0.2s;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background: #fff;
          border-radius: 50%;
          transition: 0.2s;
        }

        .toggle input:checked + .toggle-slider {
          background: #3b82f6;
        }

        .toggle input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }

        .toggle-hint {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.35);
          margin-left: auto;
        }

        /* Sections */
        .section {
          margin-bottom: 28px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .section-header h2 {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .section-count {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .badge-future {
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          background: rgba(148, 163, 184, 0.12);
          color: rgba(148, 163, 184, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        /* Table */
        .table-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          overflow: hidden;
        }

        .table-wrap {
          overflow-x: auto;
        }

        .customers-table {
          width: 100%;
          border-collapse: collapse;
        }

        .customers-table thead {
          background: rgba(255, 255, 255, 0.03);
        }

        .customers-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .customers-table td {
          padding: 12px 16px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .customers-table tr:last-child td {
          border-bottom: none;
        }

        .customers-table tbody tr:hover {
          background: rgba(59, 130, 246, 0.04);
        }

        .cell-name {
          font-weight: 500;
          color: #fff !important;
        }

        .cell-state {
          color: rgba(255, 255, 255, 0.6) !important;
        }

        .cell-orders {
          font-weight: 500;
          color: #3b82f6 !important;
        }

        .cell-date {
          font-size: 12px !important;
          color: rgba(255, 255, 255, 0.5) !important;
        }

        /* Placeholder Panel */
        .placeholder-panel {
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 40px 24px;
          text-align: center;
        }

        .placeholder-icon {
          font-size: 32px;
          margin-bottom: 12px;
          opacity: 0.6;
        }

        .placeholder-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 8px;
        }

        .placeholder-note {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
        }
      `}</style>
    </div>
  );
}
