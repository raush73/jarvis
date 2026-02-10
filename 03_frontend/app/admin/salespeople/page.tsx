"use client";

import { useState } from "react";
import Link from "next/link";

// Types
type SalespersonStatus = "Active" | "Inactive";

type Salesperson = {
  id: string;
  name: string;
  email: string;
  status: SalespersonStatus;
  defaultCommissionPlan: string;
  customersOwned: number;
  lastActivity: string;
};

// Mock data
const MOCK_SALESPEOPLE: Salesperson[] = [
  {
    id: "SLP-001",
    name: "Steve Mitchell",
    email: "steve.mitchell@mw4h.com",
    status: "Active",
    defaultCommissionPlan: "Standard Tier",
    customersOwned: 24,
    lastActivity: "2026-02-09",
  },
  {
    id: "SLP-002",
    name: "David Park",
    email: "david.park@mw4h.com",
    status: "Active",
    defaultCommissionPlan: "Standard Tier",
    customersOwned: 18,
    lastActivity: "2026-02-08",
  },
  {
    id: "SLP-003",
    name: "Lisa Hernandez",
    email: "lisa.hernandez@mw4h.com",
    status: "Inactive",
    defaultCommissionPlan: "Standard Tier",
    customersOwned: 12,
    lastActivity: "2025-11-15",
  },
  {
    id: "SLP-004",
    name: "Marcus Chen",
    email: "marcus.chen@mw4h.com",
    status: "Active",
    defaultCommissionPlan: "Senior Tier",
    customersOwned: 31,
    lastActivity: "2026-02-10",
  },
  {
    id: "SLP-005",
    name: "Angela Torres",
    email: "angela.torres@mw4h.com",
    status: "Active",
    defaultCommissionPlan: "Standard Tier",
    customersOwned: 15,
    lastActivity: "2026-02-07",
  },
  {
    id: "SLP-006",
    name: "Brian Foster",
    email: "brian.foster@mw4h.com",
    status: "Active",
    defaultCommissionPlan: "Senior Tier",
    customersOwned: 28,
    lastActivity: "2026-02-09",
  },
  {
    id: "SLP-007",
    name: "Jennifer Walsh",
    email: "jennifer.walsh@mw4h.com",
    status: "Active",
    defaultCommissionPlan: "Standard Tier",
    customersOwned: 9,
    lastActivity: "2026-02-06",
  },
  {
    id: "SLP-008",
    name: "Kevin Nguyen",
    email: "kevin.nguyen@mw4h.com",
    status: "Inactive",
    defaultCommissionPlan: "Standard Tier",
    customersOwned: 5,
    lastActivity: "2025-10-20",
  },
];

export default function SalespeopleListPage() {
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter logic
  const filteredSalespeople = MOCK_SALESPEOPLE.filter((sp) => {
    if (statusFilter !== "All" && sp.status !== statusFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !sp.name.toLowerCase().includes(query) &&
        !sp.email.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    return true;
  });

  // Status badge style
  const getStatusStyle = (status: SalespersonStatus) => {
    if (status === "Active") {
      return { bg: "rgba(34, 197, 94, 0.12)", color: "#22c55e", border: "rgba(34, 197, 94, 0.25)" };
    }
    return { bg: "rgba(107, 114, 128, 0.12)", color: "#6b7280", border: "rgba(107, 114, 128, 0.25)" };
  };

  return (
    <div className="salespeople-container">
      {/* UI Shell Banner */}
      <div className="shell-banner">
        UI shell (mocked) — Internal management view — not visible to Sales roles.
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <Link href="/admin" className="back-link">
            ← Back to Admin
          </Link>
          <h1>Salespeople</h1>
          <p className="subtitle">
            Commercial owners used for Customer defaults and commission attribution.
          </p>
        </div>
        <div className="header-actions">
          <Link href="/admin/salespeople/new" className="btn-add">
            + Create Salesperson
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="statusFilter">Status</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="filter-group search-group">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="text"
            placeholder="Name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-results">
          {filteredSalespeople.length} salesperson{filteredSalespeople.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Salespeople Table */}
      <div className="table-section">
        <div className="table-wrap">
          <table className="salespeople-table">
            <thead>
              <tr>
                <th>Salesperson</th>
                <th>Email</th>
                <th>Status</th>
                <th>Default Commission Plan</th>
                <th>Customers Owned</th>
                <th>Last Activity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalespeople.map((sp) => (
                <tr key={sp.id}>
                  <td className="cell-name">{sp.name}</td>
                  <td className="cell-email">{sp.email}</td>
                  <td className="cell-status">
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: getStatusStyle(sp.status).bg,
                        color: getStatusStyle(sp.status).color,
                        borderColor: getStatusStyle(sp.status).border,
                      }}
                    >
                      {sp.status}
                    </span>
                  </td>
                  <td className="cell-plan">{sp.defaultCommissionPlan}</td>
                  <td className="cell-customers">{sp.customersOwned}</td>
                  <td className="cell-activity">{sp.lastActivity}</td>
                  <td className="cell-actions">
                    <Link href={`/admin/salespeople/${sp.id}`} className="action-btn">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredSalespeople.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-row">
                    No salespeople match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .salespeople-container {
          padding: 24px 40px 60px;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Shell Banner */
        .shell-banner {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 12px;
          font-weight: 500;
          color: #f59e0b;
          text-align: center;
          margin-bottom: 24px;
        }

        /* Header */
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
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

        .header-actions {
          padding-top: 28px;
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

        /* Filters */
        .filters-section {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          margin-bottom: 20px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-group label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .filter-group select,
        .filter-group input {
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-size: 13px;
          color: #fff;
          min-width: 140px;
        }

        .filter-group select:focus,
        .filter-group input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .filter-group select option {
          background: #1a1d24;
          color: #fff;
        }

        .filter-group input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .search-group input {
          min-width: 200px;
        }

        .filter-results {
          margin-left: auto;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          padding-bottom: 8px;
        }

        /* Table */
        .table-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          overflow: hidden;
        }

        .table-wrap {
          overflow-x: auto;
        }

        .salespeople-table {
          width: 100%;
          border-collapse: collapse;
        }

        .salespeople-table thead {
          background: rgba(255, 255, 255, 0.03);
        }

        .salespeople-table th {
          padding: 14px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .salespeople-table td {
          padding: 14px 16px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .salespeople-table tr:last-child td {
          border-bottom: none;
        }

        .salespeople-table tbody tr:hover {
          background: rgba(59, 130, 246, 0.04);
        }

        .cell-name {
          font-weight: 500;
          color: #fff !important;
        }

        .cell-email {
          color: rgba(255, 255, 255, 0.6) !important;
          font-size: 12px !important;
        }

        .cell-plan {
          color: rgba(255, 255, 255, 0.7) !important;
        }

        .cell-customers {
          font-weight: 500;
          color: #3b82f6 !important;
        }

        .cell-activity {
          font-size: 12px !important;
          color: rgba(255, 255, 255, 0.5) !important;
          white-space: nowrap;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          border-radius: 4px;
          border: 1px solid;
        }

        .cell-actions {
          white-space: nowrap;
        }

        .action-btn {
          display: inline-block;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 5px;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .action-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .empty-row {
          text-align: center;
          color: rgba(255, 255, 255, 0.4) !important;
          padding: 32px 16px !important;
        }
      `}</style>
    </div>
  );
}
