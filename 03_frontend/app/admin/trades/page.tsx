"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

// Backend trade shape
type BackendTrade = {
  id: string;
  name: string;
  code?: string;
  isActive?: boolean;
};

export default function TradesPage() {
  // Data state
  const [trades, setTrades] = useState<BackendTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch trades on mount
  useEffect(() => {
    let cancelled = false;
    async function loadTrades() {
      try {
        const data = await apiFetch<BackendTrade[]>("/trades");
        if (!cancelled) {
          setTrades(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load trades");
          setLoading(false);
        }
      }
    }
    loadTrades();
    return () => { cancelled = true; };
  }, []);

  // Modal state
  const [selectedTrade, setSelectedTrade] = useState<BackendTrade | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter logic
  const filteredTrades = trades.filter((trade) => {
    if (statusFilter !== "All") {
      const isActive = trade.isActive !== false;
      if (statusFilter === "Active" && !isActive) return false;
      if (statusFilter === "Inactive" && isActive) return false;
    }
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      if (
        !trade.name.toLowerCase().includes(query) &&
        !(trade.code?.toLowerCase().includes(query))
      ) {
        return false;
      }
    }
    return true;
  });

  // Status badge style
  const getStatusStyle = (isActive: boolean) => {
    if (isActive) {
      return { bg: "rgba(34, 197, 94, 0.12)", color: "#22c55e", border: "rgba(34, 197, 94, 0.25)" };
    }
    return { bg: "rgba(107, 114, 128, 0.12)", color: "#6b7280", border: "rgba(107, 114, 128, 0.25)" };
  };

  // Open view/edit modal
  const handleViewTrade = (trade: BackendTrade) => {
    setSelectedTrade(trade);
    setIsViewModalOpen(true);
  };

  // Close view modal
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setTimeout(() => setSelectedTrade(null), 200);
  };

  // Loading state
  if (loading) {
    return (
      <div className="trades-container" style={{ padding: "24px 40px", color: "rgba(255,255,255,0.6)" }}>
        Loading trades...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="trades-container" style={{ padding: "24px 40px", color: "#ef4444" }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="trades-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <Link href="/admin" className="back-link">
            ← Back to Admin
          </Link>
          <h1>Trades</h1>
          <p className="subtitle">
            Define and manage the skilled trades used across Jarvis Prime for orders, quotes, staffing, and compliance.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-add" onClick={() => setIsAddModalOpen(true)}>
            + Add Trade
          </button>
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
          <label htmlFor="searchInput">Search</label>
          <input
            id="searchInput"
            type="text"
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-results">
          {filteredTrades.length} trade{filteredTrades.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Trades Table */}
      <div className="table-section">
        <div className="table-wrap">
          <table className="trades-table">
            <thead>
              <tr>
                <th>Trade Name</th>
                <th>Trade Code</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade) => {
                const isActive = trade.isActive !== false;
                return (
                  <tr key={trade.id}>
                    <td className="cell-name">{trade.name}</td>
                    <td className="cell-code">{trade.code || "—"}</td>
                    <td className="cell-status">
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusStyle(isActive).bg,
                          color: getStatusStyle(isActive).color,
                          borderColor: getStatusStyle(isActive).border,
                        }}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="cell-actions">
                      <Link
                        href={`/admin/trades/${trade.id}`}
                        className="action-btn"
                      >
                        View
                      </Link>
                      <button
                        className="action-btn"
                        onClick={() => handleViewTrade(trade)}
                      >
                        View/Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-row">
                    No trades match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View/Edit Modal */}
      {isViewModalOpen && selectedTrade && (
        <div className="modal-overlay" onClick={handleCloseViewModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Trade Details</h2>
              <button className="modal-close" onClick={handleCloseViewModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-field">
                  <label>Trade Name</label>
                  <input type="text" defaultValue={selectedTrade.name} readOnly />
                </div>

                <div className="form-field">
                  <label>Trade Code / Slug</label>
                  <input type="text" defaultValue={selectedTrade.code || ""} readOnly />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Status</label>
                  <div className="toggle-group">
                    <button
                      className={`toggle-btn ${selectedTrade.isActive !== false ? "active" : ""}`}
                      type="button"
                    >
                      Active
                    </button>
                    <button
                      className={`toggle-btn ${selectedTrade.isActive === false ? "active" : ""}`}
                      type="button"
                    >
                      Inactive
                    </button>
                  </div>
                </div>
                <div className="form-field" />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseViewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Trade Modal (UI shell only) */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Trade</h2>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-field">
                  <label>Trade Name</label>
                  <input type="text" placeholder="e.g., Millwright" />
                </div>

                <div className="form-field">
                  <label>Trade Code / Slug</label>
                  <input type="text" placeholder="e.g., MILLWRIGHT" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Status</label>
                  <div className="toggle-group">
                    <button className="toggle-btn active" type="button">
                      Active
                    </button>
                    <button className="toggle-btn" type="button">
                      Inactive
                    </button>
                  </div>
                </div>
                <div className="form-field" />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={() => setIsAddModalOpen(false)}>
                Add Trade
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .trades-container {
          padding: 24px 40px 60px;
          max-width: 1200px;
          margin: 0 auto;
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
          max-width: 520px;
          line-height: 1.5;
        }

        .header-actions {
          padding-top: 28px;
        }

        .btn-add {
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          background: #3b82f6;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
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
          color: rgba(255, 255, 255, 0.35);
        }

        .search-group input {
          min-width: 220px;
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

        .trades-table {
          width: 100%;
          border-collapse: collapse;
        }

        .trades-table thead {
          background: rgba(255, 255, 255, 0.03);
        }

        .trades-table th {
          padding: 14px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .trades-table td {
          padding: 14px 16px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .trades-table tr:last-child td {
          border-bottom: none;
        }

        .trades-table tbody tr:hover {
          background: rgba(59, 130, 246, 0.04);
        }

        .cell-name {
          font-weight: 500;
          color: #fff !important;
        }

        .cell-code {
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px !important;
          color: rgba(255, 255, 255, 0.6) !important;
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
          padding: 6px 12px;
          margin-right: 8px;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .action-btn:last-child {
          margin-right: 0;
        }

        .empty-row {
          text-align: center;
          color: rgba(255, 255, 255, 0.4) !important;
          padding: 32px 16px !important;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal {
          width: 560px;
          max-width: 90%;
          max-height: 90vh;
          background: #12151b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: rgba(255, 255, 255, 0.5);
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .modal-close:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-field {
          margin-bottom: 20px;
        }

        .form-field label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 8px;
        }

        .form-field input,
        .form-field select,
        .form-field textarea {
          width: 100%;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-size: 14px;
          color: #fff;
        }

        .form-field input:focus,
        .form-field select:focus,
        .form-field textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .form-field input::placeholder,
        .form-field textarea::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .form-field select option {
          background: #1a1d24;
          color: #fff;
        }

        .form-field textarea {
          resize: vertical;
          min-height: 60px;
        }

        .toggle-group {
          display: flex;
          gap: 0;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          overflow: hidden;
        }

        .toggle-btn {
          flex: 1;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.5);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .toggle-btn:first-child {
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }

        .toggle-btn:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        .toggle-btn.active {
          color: #fff;
          background: rgba(34, 197, 94, 0.15);
        }

        .audit-section {
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          margin-top: 8px;
        }

        .audit-title {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.45);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 14px;
        }

        .audit-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .audit-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .audit-label {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
        }

        .audit-value {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .btn-cancel {
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-cancel:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-save {
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          background: #3b82f6;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-save:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
}

