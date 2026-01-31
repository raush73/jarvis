'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import OrderNav from '@/components/OrderNav';

/**
 * Timesheets Page — Internal MW4H View (UI Shell)
 * 
 * Order-scoped timesheet management for internal users.
 * Shows section headers only — no tables, rows, totals, or computed logic.
 * 
 * Route: /orders/[id]/timesheets
 * 
 * Micro-Build 5: Finalization + override UI shells (internal only).
 * 
 * VISIBILITY LOCKS (ABSOLUTE):
 * - NO editable employee reference forms
 * - NO customer-facing approve/reject controls
 * - NO payroll math
 * - NO invoice math
 * - NO history tables with data
 * - NO employee-visible content
 * - NO customer-visible content
 */

// DEMO MODE toggle - set to false to hide demo data
const DEMO_MODE = true;

// DEMO: Official Hours data (inline mock - strings only, no computed totals)
const DEMO_OFFICIAL_HOURS = [
  { name: 'J. Martinez', trade: 'Electrician', dayCount: '5 days', hoursLabel: '40.0 hrs' },
  { name: 'S. Thompson', trade: 'Plumber', dayCount: '4 days', hoursLabel: '32.0 hrs' },
  { name: 'R. Chen', trade: 'HVAC Tech', dayCount: '5 days', hoursLabel: '42.5 hrs' },
  { name: 'M. Davis', trade: 'Carpenter', dayCount: '3 days', hoursLabel: '24.0 hrs' },
];

// DEMO: Customer review status
const DEMO_CUSTOMER_REVIEW = {
  status: 'Submitted',
  note: 'Customer review pending - awaiting approval.',
};

// DEMO: Reference signals (internal only)
const DEMO_REFERENCE_SIGNALS = [
  'Employee reference entry received (not billable).',
  'Mismatch flagged (demo).',
];

// Mock finalized snapshots (inline mock data - shell only, ASCII dashes)
const MOCK_SNAPSHOTS = [
  {
    id: 'snap-001',
    weekLabel: 'Week of Jan 20 - Jan 26, 2026',
    finalizedBy: 'J. Martinez',
    timestamp: '2026-01-27 09:14:32 EST',
  },
  {
    id: 'snap-002',
    weekLabel: 'Week of Jan 13 - Jan 19, 2026',
    finalizedBy: 'S. Thompson',
    timestamp: '2026-01-20 08:47:15 EST',
  },
];

export default function TimesheetsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  // Mock review window state (visual only - no logic)
  const reviewWindowOpen = true;
  const weekLabel = 'Week of Jan 27 - Feb 2, 2026';

  // Override panel visibility (UI state only — no persistence)
  const [showOverridePanel, setShowOverridePanel] = useState(false);

  return (
    <div className="timesheets-page">
      <OrderNav />
      
      <div className="page-content">
        {/* DEMO MODE Banner */}
        {DEMO_MODE && (
          <div className="demo-banner">
            <span className="demo-icon">[!]</span>
            <span className="demo-text">DEMO DATA - UI ONLY (toggle: DEMO_MODE)</span>
          </div>
        )}

        {/* Page Header */}
        <header className="page-header">
          <div className="breadcrumb">
            <button className="breadcrumb-link" onClick={() => router.push('/orders')}>
              Orders
            </button>
            <span className="breadcrumb-sep">/</span>
            <button className="breadcrumb-link" onClick={() => router.push(`/orders/${orderId}`)}>
              {orderId}
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Timesheets</span>
          </div>
          <h1 className="page-title">📋 Timesheets</h1>
          <p className="page-subtitle">Internal review &amp; finalization</p>
          <p className="page-visibility-note">
            🔒 Internal MW4H view — not visible to employees or customers.
          </p>
        </header>

        {/* Review Window Indicator (Visual Only) */}
        <div className={`review-window-indicator ${reviewWindowOpen ? 'open' : 'closed'}`}>
          <div className="review-window-status">
            <span className="review-window-icon">{reviewWindowOpen ? '🟢' : '🔴'}</span>
            <span className="review-window-label">
              Review window: <strong>{reviewWindowOpen ? 'OPEN' : 'CLOSED'}</strong>
            </span>
          </div>
          <span className="review-window-week">{weekLabel}</span>
        </div>

        {/* Section: Official Hours */}
        <section className="shell-section">
          <h2 className="section-title">
            <span className="section-icon">[T]</span>
            Official Hours
          </h2>
          {DEMO_MODE ? (
            <div className="demo-hours-list">
              {DEMO_OFFICIAL_HOURS.map((worker, idx) => (
                <div key={idx} className="demo-hours-row">
                  <div className="demo-worker-info">
                    <span className="demo-worker-name">{worker.name}</span>
                    <span className="demo-worker-trade">{worker.trade}</span>
                  </div>
                  <div className="demo-worker-hours">
                    <span className="demo-day-count">{worker.dayCount}</span>
                    <span className="demo-hours-label">{worker.hoursLabel}</span>
                  </div>
                </div>
              ))}
              <p className="demo-note">DEMO: Read-only display - no totals computed.</p>
            </div>
          ) : (
            <div className="section-placeholder">
              <span className="placeholder-text">
                Final approved hours for this order period will be displayed here.
                <br />
                <span className="placeholder-note">No data - shell only.</span>
              </span>
            </div>
          )}
        </section>

        {/* Section: Projects & Job Sites */}
        <section className="shell-section">
          <h2 className="section-title">
            Projects & Job Sites
          </h2>
          {DEMO_MODE ? (
            <div>
              {(() => {
                const demoProjects = [
                  {
                    projectLabel: 'Main Building Electrical',
                    poNumber: 'PO-2026-0142',
                    hoursLabel: '72.5 hrs',
                    employees: [
                      { employeeLabel: 'J. Martinez', hoursLabel: '40.0 hrs' },
                      { employeeLabel: 'R. Chen', hoursLabel: '32.5 hrs' },
                    ],
                  },
                  {
                    projectLabel: 'HVAC Installation - Wing B',
                    poNumber: 'PO-2026-0156',
                    hoursLabel: '56.0 hrs',
                    employees: [
                      { employeeLabel: 'R. Chen', hoursLabel: '10.0 hrs' },
                      { employeeLabel: 'S. Thompson', hoursLabel: '32.0 hrs' },
                      { employeeLabel: 'M. Davis', hoursLabel: '14.0 hrs' },
                    ],
                  },
                  {
                    projectLabel: 'Carpentry - Office Renovation',
                    poNumber: 'PO-2026-0163',
                    hoursLabel: '10.0 hrs',
                    employees: [
                      { employeeLabel: 'M. Davis', hoursLabel: '10.0 hrs' },
                    ],
                  },
                ];
                return demoProjects.map((project, idx) => (
                  <div key={idx}>
                    <div>{project.projectLabel} — {project.poNumber}</div>
                    <div>Total: {project.hoursLabel}</div>
                    <div>
                      {project.employees.map((emp, empIdx) => (
                        <div key={empIdx}>{emp.employeeLabel} — {emp.hoursLabel}</div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
              <p>ℹ️ Overtime calculation is handled by backend payroll rules (demo view only).</p>
            </div>
          ) : (
            <div className="section-placeholder">
              <span className="placeholder-text">
                Project and job site hour breakdown will be displayed here.
                <br />
                <span className="placeholder-note">No data - shell only.</span>
              </span>
            </div>
          )}
        </section>

        {/* Section: Customer Review */}
        <section className="shell-section">
          <h2 className="section-title">
            <span className="section-icon">[R]</span>
            Customer Review
          </h2>
          {DEMO_MODE ? (
            <div className="demo-customer-review">
              <div className="demo-review-status">
                <span className="demo-status-badge" data-status={DEMO_CUSTOMER_REVIEW.status.toLowerCase()}>
                  {DEMO_CUSTOMER_REVIEW.status}
                </span>
              </div>
              <p className="demo-review-note">{DEMO_CUSTOMER_REVIEW.note}</p>
              <p className="demo-note">DEMO: Read-only status - no approve/reject controls.</p>
            </div>
          ) : (
            <div className="section-placeholder">
              <span className="placeholder-text">
                Customer review status will be displayed here (read-only).
                <br />
                <span className="placeholder-note">No approve/reject controls - internal view only.</span>
              </span>
            </div>
          )}
        </section>

        {/* Section: Reference Signals (Internal Only) */}
        <section className="shell-section internal-section">
          <h2 className="section-title">
            <span className="section-icon">[S]</span>
            Reference Signals
            <span className="internal-badge">Internal Only</span>
          </h2>
          {DEMO_MODE ? (
            <div className="demo-reference-signals">
              <ul className="demo-signals-list">
                {DEMO_REFERENCE_SIGNALS.map((signal, idx) => (
                  <li key={idx} className="demo-signal-item">{signal}</li>
                ))}
              </ul>
              <p className="demo-note">DEMO: Internal-only signals - never customer-visible.</p>
            </div>
          ) : (
            <div className="section-placeholder">
              <span className="placeholder-text">
                Employee-submitted reference hours for internal comparison.
                <br />
                <span className="placeholder-note">Never billable. Never visible to customers.</span>
              </span>
            </div>
          )}
        </section>

        {/* Section: Finalize & Snapshots */}
        <section className="shell-section">
          <h2 className="section-title">
            <span className="section-icon">✅</span>
            Finalize &amp; Snapshots
          </h2>

          {/* Finalize Action */}
          <div className="finalize-action-box">
            <div className="finalize-info">
              <h3 className="finalize-heading">Finalize Current Period</h3>
              <p className="finalize-helper">
                Finalization creates an <strong>immutable snapshot</strong> of the approved hours for this period.
                Once finalized, the snapshot is used for payroll processing and invoicing downstream.
                This action cannot be undone without an emergency override.
              </p>
            </div>
            <button className="finalize-btn" disabled>
              Finalize Timesheet
            </button>
          </div>

          {/* Finalized Snapshots List */}
          <div className="snapshots-section">
            <h3 className="snapshots-heading">Finalized Snapshots</h3>
            <div className="snapshots-list">
              {MOCK_SNAPSHOTS.map((snapshot) => (
                <div key={snapshot.id} className="snapshot-item">
                  <div className="snapshot-week">{snapshot.weekLabel}</div>
                  <div className="snapshot-meta">
                    <span className="snapshot-by">Finalized by: {snapshot.finalizedBy}</span>
                    <span className="snapshot-time">{snapshot.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Override */}
          <div className="override-section">
            <button
              className="override-trigger"
              onClick={() => setShowOverridePanel(true)}
            >
              Emergency Override
            </button>
          </div>
        </section>

        {/* Emergency Override Panel (Shell Only) */}
        {showOverridePanel && (
          <div className="override-backdrop" onClick={() => setShowOverridePanel(false)}>
            <div className="override-panel" onClick={(e) => e.stopPropagation()}>
              <div className="override-panel-header">
                <h3 className="override-panel-title">Emergency Override</h3>
                <button
                  className="override-close-btn"
                  onClick={() => setShowOverridePanel(false)}
                >
                  ×
                </button>
              </div>
              <div className="override-panel-body">
                <div className="override-warning">
                  Overrides are audited. All override actions are logged with user identity, timestamp, and reason.
                </div>
                <label className="override-label">
                  Reason for Override <span className="required-marker">*</span>
                </label>
                <textarea
                  className="override-textarea"
                  placeholder="Provide detailed justification for this override..."
                  rows={4}
                  required
                />
                <div className="override-panel-actions">
                  <button
                    className="override-cancel-btn"
                    onClick={() => setShowOverridePanel(false)}
                  >
                    Cancel
                  </button>
                  <button className="override-submit-btn" disabled>
                    Submit Override
                  </button>
                </div>
              </div>
              <div className="override-panel-footer">
                <span className="shell-indicator">UI Shell — No actions wired</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .timesheets-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #0c0f14 0%, #111827 100%);
          color: #fff;
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .page-content {
          padding: 24px 40px 60px;
          max-width: 1000px;
          margin: 0 auto;
        }

        /* DEMO Banner */
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

        /* DEMO Official Hours List */
        .demo-hours-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .demo-hours-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
        }

        .demo-worker-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .demo-worker-name {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .demo-worker-trade {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .demo-worker-hours {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .demo-day-count {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .demo-hours-label {
          font-size: 14px;
          font-weight: 600;
          color: #60a5fa;
        }

        .demo-note {
          margin: 12px 0 0 0;
          padding: 8px 12px;
          background: rgba(245, 158, 11, 0.08);
          border-radius: 6px;
          font-size: 11px;
          color: #fbbf24;
          font-style: italic;
        }

        /* DEMO Customer Review */
        .demo-customer-review {
          padding: 16px 0;
        }

        .demo-review-status {
          margin-bottom: 12px;
        }

        .demo-status-badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .demo-status-badge[data-status="submitted"] {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .demo-status-badge[data-status="approved"] {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .demo-status-badge[data-status="rejected"] {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .demo-review-note {
          margin: 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        /* DEMO Reference Signals */
        .demo-reference-signals {
          padding: 8px 0;
        }

        .demo-signals-list {
          margin: 0;
          padding-left: 20px;
          list-style-type: disc;
        }

        .demo-signal-item {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.8;
        }

        /* Page Header */
        .page-header {
          margin-bottom: 32px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
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
        }

        .breadcrumb-current {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
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
          margin: 0 0 8px 0;
          font-size: 15px;
          color: rgba(255, 255, 255, 0.6);
        }

        .page-visibility-note {
          margin: 0;
          padding: 8px 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 6px;
          font-size: 13px;
          color: #fca5a5;
          display: inline-block;
        }

        /* Review Window Indicator */
        .review-window-indicator {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-radius: 10px;
          margin-bottom: 24px;
        }

        .review-window-indicator.open {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .review-window-indicator.closed {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .review-window-status {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .review-window-icon {
          font-size: 14px;
        }

        .review-window-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
        }

        .review-window-indicator.open .review-window-label strong {
          color: #4ade80;
        }

        .review-window-indicator.closed .review-window-label strong {
          color: #f87171;
        }

        .review-window-week {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Shell Sections */
        .shell-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
        }

        .internal-section {
          background: rgba(245, 158, 11, 0.04);
          border-color: rgba(245, 158, 11, 0.2);
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

        .internal-badge {
          margin-left: auto;
          padding: 4px 10px;
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .section-placeholder {
          padding: 32px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          text-align: center;
        }

        .placeholder-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
          font-style: italic;
          line-height: 1.6;
        }

        .placeholder-note {
          display: block;
          margin-top: 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
        }

        /* Finalize Action Box */
        .finalize-action-box {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          padding: 20px;
          background: rgba(34, 197, 94, 0.05);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .finalize-info {
          flex: 1;
        }

        .finalize-heading {
          margin: 0 0 8px 0;
          font-size: 15px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .finalize-helper {
          margin: 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.6;
        }

        .finalize-helper strong {
          color: rgba(255, 255, 255, 0.75);
        }

        .finalize-btn {
          padding: 10px 20px;
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.4);
          border-radius: 6px;
          color: #4ade80;
          font-size: 14px;
          font-weight: 600;
          cursor: not-allowed;
          opacity: 0.6;
          white-space: nowrap;
        }

        /* Snapshots Section */
        .snapshots-section {
          margin-bottom: 24px;
        }

        .snapshots-heading {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }

        .snapshots-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .snapshot-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
        }

        .snapshot-week {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.85);
        }

        .snapshot-meta {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .snapshot-by {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .snapshot-time {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          font-family: 'SF Mono', monospace;
        }

        /* Override Section */
        .override-section {
          padding-top: 16px;
          border-top: 1px dashed rgba(255, 255, 255, 0.1);
        }

        .override-trigger {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          color: #f87171;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .override-trigger:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.5);
        }

        /* Override Panel (Modal Shell) */
        .override-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .override-panel {
          width: 100%;
          max-width: 480px;
          background: #1a1f2e;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }

        .override-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .override-panel-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #f87171;
        }

        .override-close-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          padding: 0;
        }

        .override-close-btn:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        .override-panel-body {
          padding: 20px;
        }

        .override-warning {
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 6px;
          font-size: 13px;
          color: #fca5a5;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .override-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 8px;
        }

        .required-marker {
          color: #f87171;
        }

        .override-textarea {
          width: 100%;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          color: #fff;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          margin-bottom: 16px;
        }

        .override-textarea::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .override-textarea:focus {
          outline: none;
          border-color: rgba(239, 68, 68, 0.5);
        }

        .override-panel-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .override-cancel-btn {
          padding: 10px 16px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .override-cancel-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .override-submit-btn {
          padding: 10px 16px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 6px;
          color: #f87171;
          font-size: 14px;
          font-weight: 600;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .override-panel-footer {
          padding: 12px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          text-align: center;
        }

        .shell-indicator {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.3);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

