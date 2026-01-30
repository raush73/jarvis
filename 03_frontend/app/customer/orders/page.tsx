'use client';

import { useRouter } from 'next/navigation';

/**
 * Customer Orders List — UI Shell / Demo Only
 * 
 * A READ-ONLY view of customer orders.
 * This is a CUSTOMER-SAFE projection showing only:
 * - Order name
 * - Site / Location
 * - Date range
 * - Status
 * 
 * Links to dispatch view for each order.
 * 
 * Route: /customer/orders
 */

// Mock customer orders data (inline, no external fetching)
const MOCK_CUSTOMER_ORDERS = [
  {
    id: 'cust_ord_001',
    orderName: 'Refinery Turnaround Q1',
    site: 'Marathon Petroleum Refinery — Texas City, TX',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    status: 'Dispatched' as const,
  },
  {
    id: 'cust_ord_002',
    orderName: 'Power Plant Maintenance',
    site: 'NRG W.A. Parish Generating Station — Thompsons, TX',
    startDate: '2026-03-05',
    endDate: '2026-03-20',
    status: 'Scheduled' as const,
  },
  {
    id: 'cust_ord_003',
    orderName: 'Chemical Plant Expansion',
    site: 'BASF Freeport Site — Freeport, TX',
    startDate: '2026-04-10',
    endDate: '2026-05-15',
    status: 'Scheduled' as const,
  },
  {
    id: 'cust_ord_004',
    orderName: 'LNG Terminal Commissioning',
    site: 'Sabine Pass LNG — Sabine Pass, TX',
    startDate: '2026-06-01',
    endDate: '2026-07-30',
    status: 'Pending' as const,
  },
];

function formatDateRange(startDate: string, endDate: string): string {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startStr = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const endStr = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${startStr} — ${endStr}`;
  } catch {
    return `${startDate} — ${endDate}`;
  }
}

function getStatusColor(status: string): { bg: string; text: string; border: string } {
  switch (status) {
    case 'Dispatched':
      return {
        bg: 'rgba(34, 197, 94, 0.12)',
        text: '#4ade80',
        border: 'rgba(34, 197, 94, 0.3)',
      };
    case 'Scheduled':
      return {
        bg: 'rgba(59, 130, 246, 0.12)',
        text: '#60a5fa',
        border: 'rgba(59, 130, 246, 0.3)',
      };
    case 'Pending':
    default:
      return {
        bg: 'rgba(245, 158, 11, 0.12)',
        text: '#fbbf24',
        border: 'rgba(245, 158, 11, 0.3)',
      };
  }
}

export default function CustomerOrdersPage() {
  const router = useRouter();

  return (
    <div className="customer-orders-page">
      {/* Customer Portal Banner */}
      <div className="portal-banner">
        <span className="portal-icon">🏢</span>
        <div className="portal-content">
          <span className="portal-title">Customer Portal (Read-Only)</span>
          <span className="portal-note">View dispatch information for your orders</span>
        </div>
      </div>

      {/* Demo Warning Banner */}
      <div className="demo-banner">
        <span className="demo-icon">⚠️</span>
        <span className="demo-text">UI Shell / Mock Data / Demo Only</span>
      </div>

      {/* Page Header */}
      <header className="page-header">
        <h1 className="page-title">Your Orders</h1>
        <p className="page-subtitle">
          View dispatch details for your active and upcoming orders
        </p>
      </header>

      {/* Orders List */}
      <div className="orders-list">
        {MOCK_CUSTOMER_ORDERS.map(order => {
          const statusColors = getStatusColor(order.status);
          return (
            <div
              key={order.id}
              className="order-card"
              onClick={() => router.push(`/customer/orders/${order.id}/dispatch`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  router.push(`/customer/orders/${order.id}/dispatch`);
                }
              }}
            >
              <div className="order-main">
                <div className="order-header">
                  <h2 className="order-name">{order.orderName}</h2>
                  <span
                    className="status-badge"
                    style={{
                      background: statusColors.bg,
                      color: statusColors.text,
                      borderColor: statusColors.border,
                    }}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="order-details">
                  <div className="detail-row">
                    <span className="detail-icon">📍</span>
                    <span className="detail-text">{order.site}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">📅</span>
                    <span className="detail-text">{formatDateRange(order.startDate, order.endDate)}</span>
                  </div>
                </div>
              </div>
              <div className="order-action">
                <span className="action-text">View Dispatch</span>
                <span className="action-arrow">→</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="footer-note">
        <span className="note-icon">ℹ️</span>
        <span className="note-text">
          This view shows dispatch details for your orders. For questions or changes, please contact your account representative.
        </span>
      </div>

      <style jsx>{`
        .customer-orders-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #0c0f14 0%, #111827 100%);
          color: #fff;
          padding: 24px 40px 60px;
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Customer Portal Banner */
        .portal-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
          border: 1px solid rgba(34, 197, 94, 0.25);
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .portal-icon {
          font-size: 24px;
        }

        .portal-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .portal-title {
          font-size: 15px;
          font-weight: 600;
          color: #86efac;
        }

        .portal-note {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.55);
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
          margin-bottom: 32px;
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

        /* Page Header */
        .page-header {
          margin-bottom: 32px;
        }

        .page-title {
          margin: 0 0 8px 0;
          font-size: 34px;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        .page-subtitle {
          margin: 0;
          font-size: 15px;
          color: rgba(255, 255, 255, 0.6);
        }

        /* Orders List */
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 900px;
        }

        .order-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .order-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(59, 130, 246, 0.25);
          transform: translateX(4px);
        }

        .order-card:focus-visible {
          outline: 2px solid rgba(59, 130, 246, 0.5);
          outline-offset: 2px;
        }

        .order-main {
          flex: 1;
        }

        .order-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 14px;
        }

        .order-name {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #fff;
        }

        .status-badge {
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border: 1px solid;
        }

        .order-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .detail-icon {
          font-size: 14px;
          opacity: 0.7;
        }

        .detail-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        .order-action {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .order-card:hover .order-action {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.35);
        }

        .action-text {
          font-size: 13px;
          font-weight: 500;
          color: #60a5fa;
        }

        .action-arrow {
          font-size: 16px;
          color: #60a5fa;
          transition: transform 0.2s ease;
        }

        .order-card:hover .action-arrow {
          transform: translateX(3px);
        }

        /* Footer Note */
        .footer-note {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          max-width: 900px;
          margin-top: 40px;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
        }

        .note-icon {
          font-size: 16px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .note-text {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.5;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .customer-orders-page {
            padding: 20px;
          }

          .order-card {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .order-action {
            justify-content: center;
          }

          .order-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }

        /* Print Styles */
        @media print {
          .customer-orders-page {
            background: #fff;
            color: #000;
            padding: 20px;
          }

          .demo-banner {
            display: none;
          }

          .order-card {
            border-color: #e5e7eb;
            background: #f9fafb;
          }

          .page-title {
            -webkit-text-fill-color: #000;
            background: none;
            color: #000;
          }
        }
      `}</style>
    </div>
  );
}

