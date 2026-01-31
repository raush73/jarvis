'use client';

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
 * Micro-Build 1: Shell only.
 */

export default function TimesheetsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  return (
    <div className="timesheets-page">
      <OrderNav />
      
      <div className="page-content">
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
          <p className="page-subtitle">UI Shell (Micro-Build 1)</p>
        </header>

        {/* Section: Official Hours */}
        <section className="shell-section">
          <h2 className="section-title">
            <span className="section-icon">⏱️</span>
            Official Hours
          </h2>
          <div className="section-placeholder">
            <span className="placeholder-text">Official hours entry and display will appear here.</span>
          </div>
        </section>

        {/* Section: Customer Review */}
        <section className="shell-section">
          <h2 className="section-title">
            <span className="section-icon">👁️</span>
            Customer Review
          </h2>
          <div className="section-placeholder">
            <span className="placeholder-text">Customer review status and actions will appear here.</span>
          </div>
        </section>

        {/* Section: Reference Signals (Internal Only) */}
        <section className="shell-section internal-section">
          <h2 className="section-title">
            <span className="section-icon">📊</span>
            Reference Signals
            <span className="internal-badge">Internal Only</span>
          </h2>
          <div className="section-placeholder">
            <span className="placeholder-text">Employee reference signals for internal comparison will appear here.</span>
          </div>
        </section>

        {/* Section: Finalize & Snapshots */}
        <section className="shell-section">
          <h2 className="section-title">
            <span className="section-icon">✅</span>
            Finalize &amp; Snapshots
          </h2>
          <div className="section-placeholder">
            <span className="placeholder-text">Approval finalization and snapshot controls will appear here.</span>
          </div>
        </section>
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
        }
      `}</style>
    </div>
  );
}

