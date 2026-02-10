"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

// Mock customers data
const MOCK_CUSTOMERS = [
  {
    id: "CUST-001",
    name: "Turner Construction",
    city: "Los Angeles",
    state: "CA",
    mainPhone: "(213) 555-1000",
    website: "https://turnerconstruction.com",
    ownerSalespersonName: "Jordan Miles",
    lastUpdated: "2 hours ago",
  },
  {
    id: "CUST-002",
    name: "Skanska USA",
    city: "San Diego",
    state: "CA",
    mainPhone: "(619) 555-2000",
    website: "https://skanska.com",
    ownerSalespersonName: "Sarah Chen",
    lastUpdated: "5 hours ago",
  },
  {
    id: "CUST-003",
    name: "McCarthy Building",
    city: "Phoenix",
    state: "AZ",
    mainPhone: "(602) 555-3000",
    website: "https://mccarthy.com",
    ownerSalespersonName: "Marcus Johnson",
    lastUpdated: "1 day ago",
  },
  {
    id: "CUST-004",
    name: "DPR Construction",
    city: "Las Vegas",
    state: "NV",
    mainPhone: "(702) 555-4000",
    website: "https://dpr.com",
    ownerSalespersonName: "Jordan Miles",
    lastUpdated: "2 days ago",
  },
  {
    id: "CUST-005",
    name: "Hensel Phelps",
    city: "Denver",
    state: "CO",
    mainPhone: "(303) 555-5000",
    website: "https://henselphelps.com",
    ownerSalespersonName: "Emily Rodriguez",
    lastUpdated: "3 days ago",
  },
  {
    id: "CUST-006",
    name: "Holder Construction",
    city: "Austin",
    state: "TX",
    mainPhone: "(512) 555-6000",
    website: "https://holderconstruction.com",
    ownerSalespersonName: "Sarah Chen",
    lastUpdated: "5 days ago",
  },
  {
    id: "CUST-007",
    name: "Whiting-Turner Contracting",
    city: "Seattle",
    state: "WA",
    mainPhone: "(206) 555-7000",
    website: "https://whiting-turner.com",
    ownerSalespersonName: "Marcus Johnson",
    lastUpdated: "1 week ago",
  },
  {
    id: "CUST-008",
    name: "Mortenson Construction",
    city: "Minneapolis",
    state: "MN",
    mainPhone: "(612) 555-8000",
    website: "https://mortenson.com",
    ownerSalespersonName: "Emily Rodriguez",
    lastUpdated: "2 weeks ago",
  },
];

export default function CustomersPage() {
  const router = useRouter();

  return (
    <div className="customers-container">
      {/* Page Header */}
      <div className="customers-header">
        <div className="header-left">
          <h1>Customers</h1>
          <span className="customer-count">{MOCK_CUSTOMERS.length} customers</span>
        </div>
        <div className="header-actions">
          <Link href="/customers/new" className="btn-add">
            + Create Customer
          </Link>
        </div>
      </div>

      {/* Customers Table */}
      <div className="customers-table-wrap">
        <table className="customers-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Location</th>
              <th>Main Phone</th>
              <th>Default Salesperson</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CUSTOMERS.map((customer) => (
              <tr
                key={customer.id}
                onClick={() => router.push(`/customers/${customer.id}`)}
                className="customer-row"
              >
                <td className="customer-name">
                  <span className="name-text">{customer.name}</span>
                  <span className="customer-id">{customer.id}</span>
                </td>
                <td className="location">
                  {customer.city}, {customer.state}
                </td>
                <td className="phone">{customer.mainPhone}</td>
                <td className="salesperson">
                  <span className="salesperson-name">{customer.ownerSalespersonName}</span>
                  <span className="read-only-indicator">read-only</span>
                </td>
                <td className="last-updated">{customer.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .customers-container {
          padding: 32px 40px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .customers-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }

        .header-left {
          display: flex;
          align-items: baseline;
          gap: 16px;
        }

        .header-left h1 {
          font-size: 26px;
          font-weight: 600;
          color: #fff;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .customer-count {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
        }

        .header-actions {
          display: flex;
          align-items: center;
        }

        .btn-add {
          display: inline-block;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          background: #3b82f6;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
        }

        .btn-add:hover {
          background: #2563eb;
        }

        .customers-table-wrap {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          overflow: hidden;
        }

        .customers-table {
          width: 100%;
          border-collapse: collapse;
        }

        .customers-table thead {
          background: rgba(255, 255, 255, 0.03);
        }

        .customers-table th {
          padding: 14px 20px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .customers-table td {
          padding: 16px 20px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .customer-row {
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .customer-row:hover {
          background: rgba(59, 130, 246, 0.08);
        }

        .customer-row:last-child td {
          border-bottom: none;
        }

        .customer-name {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .name-text {
          font-weight: 500;
          color: #fff;
        }

        .customer-id {
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px;
          color: #3b82f6;
        }

        .location {
          color: rgba(255, 255, 255, 0.7);
        }

        .phone {
          font-family: var(--font-geist-mono), monospace;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
        }

        .salesperson {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .salesperson-name {
          color: rgba(255, 255, 255, 0.85);
        }

        .read-only-indicator {
          font-size: 9px;
          padding: 2px 6px;
          background: rgba(148, 163, 184, 0.15);
          color: rgba(148, 163, 184, 0.8);
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .last-updated {
          color: rgba(255, 255, 255, 0.45) !important;
          font-size: 13px !important;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

