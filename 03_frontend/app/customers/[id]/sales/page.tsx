"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// Mock salespeople list
const MOCK_SALESPEOPLE = [
  { id: "SP-001", name: "Jordan Miles" },
  { id: "SP-002", name: "Taylor Brooks" },
  { id: "SP-003", name: "Morgan Chen" },
  { id: "SP-004", name: "Casey Rivera" },
  { id: "SP-005", name: "Alex Nguyen" },
];

// Mock customer data
const MOCK_CUSTOMER_DATA: Record<string, { name: string; defaultSalesperson: string }> = {
  "CUST-001": { name: "Turner Construction", defaultSalesperson: "SP-001" },
  "CUST-002": { name: "Skanska USA", defaultSalesperson: "SP-002" },
  "CUST-003": { name: "McCarthy Building", defaultSalesperson: "SP-003" },
};

const DEFAULT_CUSTOMER_DATA = { name: "Sample Customer", defaultSalesperson: "SP-001" };

export default function CustomerSalesPage() {
  const params = useParams();
  const customerId = params.id as string;

  const customerData = MOCK_CUSTOMER_DATA[customerId] || DEFAULT_CUSTOMER_DATA;

  const [selectedSalesperson, setSelectedSalesperson] = useState(
    customerData.defaultSalesperson
  );

  const selectedName =
    MOCK_SALESPEOPLE.find((sp) => sp.id === selectedSalesperson)?.name || "—";

  return (
    <div className="customer-sales-container">
      {/* Header */}
      <div className="page-header">
        <Link href={`/customers/${customerId}`} className="back-link">
          ← Back to Customer
        </Link>
        <div className="header-row">
          <div className="header-info">
            <h1>Sales Ownership</h1>
            <div className="customer-badge-row">
              <span className="customer-name">{customerData.name}</span>
              <span className="customer-id">{customerId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="sales-section">
        <div className="section-header">
          <h2>Default / Main Salesperson</h2>
        </div>

        <div className="salesperson-card">
          <div className="card-label">Customer Owner</div>
          <div className="salesperson-select-wrap">
            <select
              value={selectedSalesperson}
              onChange={(e) => setSelectedSalesperson(e.target.value)}
              className="salesperson-select"
            >
              {MOCK_SALESPEOPLE.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
            <span className="current-selection">{selectedName}</span>
          </div>
        </div>

        <div className="help-note">
          <span className="help-icon">i</span>
          <span>
            This salesperson is used as the default on new orders for this customer
            unless overridden at the order level.
          </span>
        </div>
      </section>

      {/* Commission Info */}
      <section className="info-section">
        <div className="section-header">
          <h2>Commission Assignment</h2>
          <span className="section-badge">Read-only</span>
        </div>

        <div className="info-card">
          <p>
            Commission splits are configured at the <strong>Order level</strong>.
            The salesperson assigned here becomes the default for new orders, but
            commission splits can be customized per order.
          </p>
          <p>
            To view or edit commission splits for a specific order, navigate to the
            order and open the <strong>Sales</strong> tab.
          </p>
        </div>
      </section>

      {/* Save Footer */}
      <div className="save-footer">
        <span className="ui-only-label">UI-only shell — no persistence</span>
        <button className="save-btn" disabled>
          Save Changes
        </button>
      </div>

      <style jsx>{`
        .customer-sales-container {
          padding: 24px 40px 60px;
          max-width: 800px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 32px;
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

        .header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .header-info h1 {
          font-size: 28px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 10px;
          letter-spacing: -0.5px;
        }

        .customer-badge-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .customer-name {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.75);
        }

        .customer-id {
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px;
          padding: 3px 8px;
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          border-radius: 5px;
        }

        /* Sales Section */
        .sales-section,
        .info-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .section-header h2 {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .section-badge {
          font-size: 10px;
          padding: 3px 8px;
          background: rgba(148, 163, 184, 0.12);
          color: rgba(148, 163, 184, 0.8);
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        /* Salesperson Card */
        .salesperson-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .card-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.45);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .salesperson-select-wrap {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .salesperson-select {
          width: 100%;
          max-width: 320px;
          padding: 12px 14px;
          font-size: 15px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
        }

        .salesperson-select:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.5);
        }

        .current-selection {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
        }

        /* Help Note */
        .help-note {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 14px 16px;
          background: rgba(59, 130, 246, 0.06);
          border: 1px dashed rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.65);
        }

        .help-icon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* Info Card */
        .info-card {
          padding: 16px 18px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
        }

        .info-card p {
          margin: 0 0 12px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
        }

        .info-card p:last-child {
          margin-bottom: 0;
        }

        .info-card strong {
          color: rgba(255, 255, 255, 0.85);
        }

        /* Save Footer */
        .save-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 16px;
          margin-top: 24px;
        }

        .ui-only-label {
          font-size: 11px;
          color: rgba(148, 163, 184, 0.7);
          padding: 4px 10px;
          background: rgba(148, 163, 184, 0.1);
          border: 1px dashed rgba(148, 163, 184, 0.25);
          border-radius: 6px;
        }

        .save-btn {
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

