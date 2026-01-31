'use client';

import { useParams, useRouter } from 'next/navigation';

/**
 * Customer Timesheets Page — UI Shell
 * 
 * Customer-facing timesheet view for order-scoped hours.
 * Shows official hours entry shell and approve/reject shell placeholders ONLY.
 * 
 * DOES NOT SHOW (CUSTOMER MAY NOT SEE):
 * - Employee reference hours
 * - Discrepancies
 * - Internal notes
 * 
 * Route: /customer/orders/[id]/timesheets
 * 
 * Micro-Build 1: Shell only.
 */

export default function CustomerTimesheetsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  return (
    <div className="customer-timesheets-page">
      {/* Demo Banner */}
      <div className="demo-banner">
        <span className="demo-icon">⚠️</span>
        <span className="demo-text">UI Shell (Micro-Build 1)</span>
      </div>

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
        <h1 className="page-title">📋 Timesheets</h1>
        <p className="page-subtitle">UI Shell (Micro-Build 1)</p>
      </header>

      {/* Section: Enter Official Hours (Shell) */}
      <section className="shell-section">
        <h2 className="section-title">
          <span className="section-icon">✏️</span>
          Enter Official Hours (Shell)
        </h2>
        <div className="section-placeholder">
          <span className="placeholder-text">Official hours entry form will appear here.</span>
        </div>
      </section>

      {/* Section: Approve / Reject MW4H Hours (Shell) */}
      <section className="shell-section">
        <h2 className="section-title">
          <span className="section-icon">✅</span>
          Approve / Reject MW4H Hours (Shell)
        </h2>
        <div className="section-placeholder">
          <span className="placeholder-text">Hours approval and rejection controls will appear here.</span>
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
          margin-bottom: 32px;
          max-width: 900px;
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

        /* Shell Sections */
        .shell-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.12);
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

