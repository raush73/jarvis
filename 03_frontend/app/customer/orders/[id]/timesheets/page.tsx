'use client';

import { useParams, useRouter } from 'next/navigation';

/**
 * Customer Timesheets Page — Micro-Build 3
 * 
 * Customer-facing timesheet view for order-scoped hours.
 * Shows official hours entry shell and approve/reject shell (UI only).
 * 
 * VISIBILITY LOCKS (ABSOLUTE - CUSTOMER MAY NOT SEE):
 * - Employee-entered reference hours
 * - Discrepancies
 * - Internal notes
 * - Review history
 * 
 * Route: /customer/orders/[id]/timesheets
 * 
 * Micro-Build 3: Official hours entry shell + Approve/Reject shell.
 */

// DEMO MODE toggle - set to false to hide demo data
const DEMO_MODE = true;

// DEMO: Static status for demonstration
const DEMO_STATUS: 'Draft' | 'Submitted' | 'Finalized' = 'Submitted';

// DEMO: Hours entry placeholder hint (not prefilling input, just a hint)
const DEMO_HOURS_HINT = 'Demo: 42.0 hours for current period';

// DEMO: MW4H submitted summary (read-only, no employee reference data)
const DEMO_MW4H_SUMMARY = 'MW4H submitted: 42.0 hours (demo)';

// Mock status for UI demonstration (static, no logic)
const MOCK_STATUS: 'Draft' | 'Submitted' | 'Finalized' = 'Draft';

export default function CustomerTimesheetsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  return (
    <div className="customer-timesheets-page">
      {/* DEMO MODE Banner */}
      {DEMO_MODE && (
        <div className="demo-banner">
          <span className="demo-icon">[!]</span>
          <span className="demo-text">DEMO DATA - UI ONLY (toggle: DEMO_MODE)</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => router.push('/customer/orders')}>
          Your Orders
        </button>
        <span className="breadcrumb-sep">›</span>
        <button className="breadcrumb-link" onClick={() => router.push(`/customer/orders/${orderId}`)}>
          {orderId}
        </button>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Timesheets</span>
      </nav>

      {/* Page Header */}
      <header className="page-header">
        <div className="header-row">
          <div className="header-text">
            <h1 className="page-title">[T] Timesheets</h1>
            <p className="page-subtitle">Official hours (customer view)</p>
          </div>
          {/* Status Badge (demo/static UI only) */}
          <div className="status-badge" data-status={(DEMO_MODE ? DEMO_STATUS : MOCK_STATUS).toLowerCase()}>
            {DEMO_MODE ? DEMO_STATUS : MOCK_STATUS}
          </div>
        </div>
        <p className="visibility-notice">Employee reference hours are not visible to customers.</p>
      </header>

      {/* Section: Enter Official Hours */}
      <section className="content-section">
        <h2 className="section-title">
          <span className="section-icon">[E]</span>
          Enter Official Hours
        </h2>
        <div className="section-body">
          <div className="hours-entry-shell">
            <label className="hours-label" htmlFor="total-hours">Total Hours</label>
            {DEMO_MODE && (
              <p className="demo-hint">{DEMO_HOURS_HINT}</p>
            )}
            <input
              id="total-hours"
              type="number"
              className="hours-input"
              placeholder="0.00"
              disabled
              aria-label="Total hours input (disabled placeholder)"
            />
            <p className="input-hint">Hours entry will be enabled in a future build.</p>
          </div>
        </div>
      </section>

      {/* Section: Approve / Reject MW4H Hours */}
      <section className="content-section">
        <h2 className="section-title">
          <span className="section-icon">[A]</span>
          Approve or Reject MW4H Hours
        </h2>
        <div className="section-body">
          <p className="section-description">
            Review and confirm the submitted hours for this order.
          </p>
          {DEMO_MODE && (
            <div className="demo-summary-card">
              <span className="demo-summary-text">{DEMO_MW4H_SUMMARY}</span>
              <p className="demo-card-note">DEMO: Read-only summary - no employee reference data shown.</p>
            </div>
          )}
          <div className="action-buttons">
            <button
              type="button"
              className="action-btn approve-btn"
              disabled
              aria-label="Approve hours (disabled)"
            >
              Approve
            </button>
            <button
              type="button"
              className="action-btn reject-btn"
              disabled
              aria-label="Reject hours (disabled)"
            >
              Reject
            </button>
          </div>
          <p className="input-hint">Approval actions will be enabled in a future build.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="page-footer">
        <button className="back-link" onClick={() => router.push('/customer/orders')}>
          ← Back to Your Orders
        </button>
      </footer>

      <style jsx>{`
        .customer-timesheets-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #0c0f14 0%, #111827 100%);
          color: #fff;
          padding: 24px 40px 60px;
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Demo Banner */
        .demo-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 10px 20px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .demo-icon {
          font-size: 14px;
          color: #fbbf24;
        }

        .demo-text {
          font-size: 12px;
          font-weight: 600;
          color: #fbbf24;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .demo-hint {
          margin: 0 0 8px 0;
          padding: 8px 12px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 6px;
          font-size: 12px;
          color: #60a5fa;
          font-style: italic;
        }

        .demo-summary-card {
          padding: 16px 20px;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .demo-summary-text {
          display: block;
          font-size: 15px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 8px;
        }

        .demo-card-note {
          margin: 0;
          font-size: 11px;
          color: #fbbf24;
          font-style: italic;
        }

        /* Breadcrumb */
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }

        .breadcrumb-link {
          background: none;
          border: none;
          padding: 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .breadcrumb-link:hover {
          color: #60a5fa;
          text-decoration: underline;
        }

        .breadcrumb-sep {
          color: rgba(255, 255, 255, 0.3);
          font-size: 14px;
        }

        .breadcrumb-current {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        /* Page Header */
        .page-header {
          margin-bottom: 32px;
          max-width: 900px;
        }

        .header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 12px;
        }

        .header-text {
          flex: 1;
        }

        .page-title {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-subtitle {
          margin: 0;
          font-size: 15px;
          color: rgba(255, 255, 255, 0.6);
        }

        /* Status Badge */
        .status-badge {
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .status-badge[data-status="draft"] {
          background: rgba(148, 163, 184, 0.15);
          color: #94a3b8;
          border: 1px solid rgba(148, 163, 184, 0.3);
        }

        .status-badge[data-status="submitted"] {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .status-badge[data-status="finalized"] {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .visibility-notice {
          margin: 0;
          padding: 10px 14px;
          background: rgba(100, 116, 139, 0.1);
          border-left: 3px solid rgba(100, 116, 139, 0.4);
          border-radius: 0 6px 6px 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
        }

        /* Content Sections */
        .content-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          max-width: 900px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
          margin: 0 0 16px 0;
        }

        .section-icon {
          font-size: 18px;
        }

        .section-body {
          padding: 16px 0 0 0;
        }

        .section-description {
          margin: 0 0 16px 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Hours Entry Shell */
        .hours-entry-shell {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 280px;
        }

        .hours-label {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
        }

        .hours-input {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.4);
          outline: none;
          transition: border-color 0.15s ease;
        }

        .hours-input:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .input-hint {
          margin: 8px 0 0 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
          font-style: italic;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }

        .action-btn {
          padding: 12px 28px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: not-allowed;
          transition: all 0.15s ease;
        }

        .approve-btn {
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #4ade80;
        }

        .approve-btn:disabled {
          opacity: 0.5;
        }

        .reject-btn {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
        }

        .reject-btn:disabled {
          opacity: 0.5;
        }

        /* Footer */
        .page-footer {
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          margin-top: 12px;
          max-width: 900px;
        }

        .back-link {
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .back-link:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.25);
          color: #60a5fa;
        }
      `}</style>
    </div>
  );
}

