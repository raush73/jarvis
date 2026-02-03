"use client";

import { useState } from "react";
import Link from "next/link";

// Mock commission tiers
const INITIAL_TIERS = [
  { id: "tier-1", name: "0–7 days", percent: 10, basis: "Gross Profit" },
  { id: "tier-2", name: "8–14 days", percent: 8, basis: "Gross Profit" },
  { id: "tier-3", name: "15–30 days", percent: 6, basis: "Gross Profit" },
  { id: "tier-4", name: "31+ days", percent: 4, basis: "Gross Profit" },
];

type Tier = {
  id: string;
  name: string;
  percent: number;
  basis: string;
};

const BASIS_OPTIONS = ["Gross Profit", "Invoice Total"];

export default function AdminCommissionsPage() {
  const [tiers, setTiers] = useState<Tier[]>(INITIAL_TIERS);
  const [partialPayments, setPartialPayments] = useState(false);
  const [negativeCommissions, setNegativeCommissions] = useState(false);
  const [holdUntilPaid, setHoldUntilPaid] = useState(true);

  const handlePercentChange = (id: string, value: string) => {
    const numVal = parseFloat(value) || 0;
    setTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, percent: numVal } : t))
    );
  };

  const handleBasisChange = (id: string, value: string) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, basis: value } : t))
    );
  };

  return (
    <div className="commissions-admin-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <Link href="/admin" className="back-link">
            ← Back to Admin
          </Link>
          <h1>Commission Structure</h1>
          <p className="subtitle">
            Configure commission tiers based on days-to-paid from invoice payment events.
          </p>
        </div>
      </div>

      {/* Tiers Table */}
      <section className="config-section">
        <div className="section-header">
          <h2>Commission Tiers</h2>
          <span className="section-note">
            Tiers determine commission % based on how quickly an invoice is paid
          </span>
        </div>

        <div className="tiers-table-wrap">
          <table className="tiers-table">
            <thead>
              <tr>
                <th>Tier Name</th>
                <th>Commission %</th>
                <th>Applies To</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr key={tier.id}>
                  <td className="tier-name">{tier.name}</td>
                  <td className="tier-percent">
                    <div className="input-wrap">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={tier.percent}
                        onChange={(e) =>
                          handlePercentChange(tier.id, e.target.value)
                        }
                      />
                      <span className="input-suffix">%</span>
                    </div>
                  </td>
                  <td className="tier-basis">
                    <select
                      value={tier.basis}
                      onChange={(e) =>
                        handleBasisChange(tier.id, e.target.value)
                      }
                    >
                      {BASIS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Toggles Section */}
      <section className="config-section">
        <div className="section-header">
          <h2>Commission Rules</h2>
          <span className="section-note">
            Placeholder toggles — not functional in UI shell
          </span>
        </div>

        <div className="toggles-list">
          <div className="toggle-row">
            <div className="toggle-info">
              <span className="toggle-label">
                Partial payments generate proportional commissions
              </span>
              <span className="toggle-desc">
                When a partial payment is recorded, calculate commission on the amount paid.
              </span>
            </div>
            <button
              className={`toggle-btn ${partialPayments ? "on" : "off"}`}
              onClick={() => setPartialPayments(!partialPayments)}
            >
              <span className="toggle-knob" />
            </button>
          </div>

          <div className="toggle-row">
            <div className="toggle-info">
              <span className="toggle-label">
                Credits/chargebacks create negative commissions
              </span>
              <span className="toggle-desc">
                Credit memos or chargebacks will create negative commission entries.
              </span>
            </div>
            <button
              className={`toggle-btn ${negativeCommissions ? "on" : "off"}`}
              onClick={() => setNegativeCommissions(!negativeCommissions)}
            >
              <span className="toggle-knob" />
            </button>
          </div>

          <div className="toggle-row">
            <div className="toggle-info">
              <span className="toggle-label">
                Hold commissions until invoice is fully paid
              </span>
              <span className="toggle-desc">
                Commissions remain pending until the invoice balance reaches zero.
              </span>
            </div>
            <button
              className={`toggle-btn ${holdUntilPaid ? "on" : "off"}`}
              onClick={() => setHoldUntilPaid(!holdUntilPaid)}
            >
              <span className="toggle-knob" />
            </button>
          </div>
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
        .commissions-admin-container {
          padding: 24px 40px 60px;
          max-width: 900px;
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

        /* Config Sections */
        .config-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
        }

        .section-header {
          display: flex;
          align-items: baseline;
          gap: 16px;
          margin-bottom: 20px;
        }

        .section-header h2 {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .section-note {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        /* Tiers Table */
        .tiers-table-wrap {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          overflow: hidden;
        }

        .tiers-table {
          width: 100%;
          border-collapse: collapse;
        }

        .tiers-table thead {
          background: rgba(255, 255, 255, 0.03);
        }

        .tiers-table th {
          padding: 12px 18px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .tiers-table td {
          padding: 14px 18px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .tiers-table tr:last-child td {
          border-bottom: none;
        }

        .tier-name {
          font-weight: 500;
          color: #fff;
        }

        .input-wrap {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .input-wrap input {
          width: 70px;
          padding: 8px 10px;
          font-size: 14px;
          font-family: var(--font-geist-mono), monospace;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 6px;
          color: #fff;
          text-align: right;
        }

        .input-wrap input:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.5);
        }

        .input-suffix {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }

        .tier-basis select {
          padding: 8px 12px;
          font-size: 13px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.85);
          cursor: pointer;
        }

        .tier-basis select:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.5);
        }

        /* Toggles */
        .toggles-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .toggle-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          padding: 16px 18px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
        }

        .toggle-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .toggle-label {
          font-size: 14px;
          font-weight: 500;
          color: #fff;
        }

        .toggle-desc {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
        }

        .toggle-btn {
          width: 48px;
          height: 26px;
          border-radius: 13px;
          border: none;
          cursor: pointer;
          position: relative;
          transition: background 0.2s ease;
          flex-shrink: 0;
        }

        .toggle-btn.off {
          background: rgba(255, 255, 255, 0.12);
        }

        .toggle-btn.on {
          background: rgba(59, 130, 246, 0.7);
        }

        .toggle-knob {
          position: absolute;
          top: 3px;
          width: 20px;
          height: 20px;
          background: #fff;
          border-radius: 50%;
          transition: left 0.2s ease;
        }

        .toggle-btn.off .toggle-knob {
          left: 3px;
        }

        .toggle-btn.on .toggle-knob {
          left: 25px;
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

