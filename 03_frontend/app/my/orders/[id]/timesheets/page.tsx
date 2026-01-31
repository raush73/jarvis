'use client';

import { useParams, useRouter } from 'next/navigation';

/**
 * Employee Timesheets Page — UI Shell
 * 
 * Employee-facing timesheet view for order-scoped reference hours entry.
 * Shows ONLY a submit-only skeleton form and confirmation placeholder.
 * 
 * DOES NOT SHOW (EMPLOYEE MAY NOT SEE):
 * - Submitted values
 * - List of previous entries
 * - History
 * - Totals
 * 
 * Employee-entered hours are REFERENCE ONLY — never billable, never customer-visible.
 * 
 * Route: /my/orders/[id]/timesheets
 * 
 * Micro-Build 1: Shell only.
 */

export default function EmployeeTimesheetsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  return (
    <div className="employee-timesheets-page">
      {/* Demo Banner */}
      <div className="demo-banner">
        <span className="demo-icon">⚠️</span>
        <span className="demo-text">UI Shell (Micro-Build 1)</span>
      </div>

      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => router.push('/my/orders')}>
          My Orders
        </button>
        <span className="breadcrumb-sep">›</span>
        <button className="breadcrumb-link" onClick={() => router.push(`/my/orders/${orderId}`)}>
          {orderId}
        </button>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Timesheets</span>
      </nav>

      {/* Page Header */}
      <header className="page-header">
        <h1 className="page-title">📋 Timesheets</h1>
        <p className="page-subtitle">UI Shell (Micro-Build 1)</p>
      </header>

      {/* Reference Hours Notice */}
      <div className="reference-notice">
        <span className="notice-icon">ℹ️</span>
        <div className="notice-content">
          <span className="notice-title">Reference Hours Only</span>
          <span className="notice-text">Hours you enter here are for internal reference only and are not billable.</span>
        </div>
      </div>

      {/* Submit Form Skeleton */}
      <section className="form-section">
        <h2 className="section-title">
          <span className="section-icon">⏱️</span>
          Enter Hours
        </h2>
        
        <div className="form-skeleton">
          {/* Input Field Skeleton */}
          <div className="input-group">
            <label className="input-label">Total hours (reference only)</label>
            <input 
              type="number" 
              className="input-field"
              placeholder="0.0"
              disabled
            />
          </div>

          {/* Submit Button (disabled) */}
          <button className="submit-btn" disabled>
            Submit
          </button>
        </div>
      </section>

      {/* Confirmation Placeholder */}
      <section className="confirmation-section">
        <div className="confirmation-placeholder">
          <span className="confirmation-icon">✓</span>
          <span className="confirmation-text">After submit: confirmation message only</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="page-footer">
        <button className="back-link" onClick={() => router.push('/my/orders')}>
          ← Back to My Orders
        </button>
      </footer>

      <style jsx>{`
        .employee-timesheets-page {
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
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .demo-icon {
          font-size: 14px;
        }

        .demo-text {
          font-size: 12px;
          font-weight: 600;
          color: #fbbf24;
          text-transform: uppercase;
          letter-spacing: 0.5px;
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
          margin-bottom: 24px;
          max-width: 500px;
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

        /* Reference Notice */
        .reference-notice {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 20px;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 10px;
          margin-bottom: 24px;
          max-width: 500px;
        }

        .notice-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .notice-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .notice-title {
          font-size: 14px;
          font-weight: 600;
          color: #60a5fa;
        }

        .notice-text {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.4;
        }

        /* Form Section */
        .form-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          max-width: 500px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
          margin: 0 0 20px 0;
        }

        .section-icon {
          font-size: 18px;
        }

        .form-skeleton {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-label {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
        }

        .input-field {
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.3);
          outline: none;
        }

        .input-field:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .submit-btn {
          padding: 14px 24px;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: rgba(96, 165, 250, 0.5);
          cursor: not-allowed;
          opacity: 0.6;
        }

        /* Confirmation Section */
        .confirmation-section {
          max-width: 500px;
          margin-bottom: 20px;
        }

        .confirmation-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px;
          background: rgba(34, 197, 94, 0.05);
          border: 1px dashed rgba(34, 197, 94, 0.2);
          border-radius: 10px;
        }

        .confirmation-icon {
          font-size: 18px;
          color: rgba(34, 197, 94, 0.4);
        }

        .confirmation-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
          font-style: italic;
        }

        /* Footer */
        .page-footer {
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          margin-top: 12px;
          max-width: 500px;
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

