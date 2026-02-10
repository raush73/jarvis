"use client";

import { useRouter, useParams } from "next/navigation";

// Invoice Detail Shell — Read-only placeholder
export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="invoice-detail-container">
      {/* Page Header */}
      <div className="detail-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleBack}>
            ← Back to Invoices
          </button>
          <div className="header-title">
            <h1>Invoice Detail</h1>
            <span className="invoice-id-badge">{invoiceId}</span>
          </div>
        </div>
      </div>

      {/* Shell Content */}
      <div className="detail-content">
        <div className="shell-placeholder">
          <span className="placeholder-icon">📄</span>
          <h2>Invoice Detail Shell</h2>
          <p>This is a read-only placeholder for invoice detail view.</p>
          <p className="placeholder-id">Invoice ID: <code>{invoiceId}</code></p>
        </div>
      </div>

      <style jsx>{`
        .invoice-detail-container {
          padding: 24px 40px 60px;
          max-width: 1200px;
          margin: 0 auto;
          min-height: 100vh;
          background: linear-gradient(180deg, #0c0f14 0%, #111827 100%);
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

        .invoice-id-badge {
          font-family: var(--font-geist-mono), monospace;
          font-size: 13px;
          padding: 4px 10px;
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          border-radius: 6px;
        }

        .detail-content {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 48px 24px;
        }

        .shell-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 12px;
        }

        .placeholder-icon {
          font-size: 48px;
          opacity: 0.6;
        }

        .shell-placeholder h2 {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .shell-placeholder p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        .placeholder-id {
          margin-top: 8px;
        }

        .placeholder-id code {
          font-family: var(--font-geist-mono), monospace;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          color: #60a5fa;
        }
      `}</style>
    </div>
  );
}
