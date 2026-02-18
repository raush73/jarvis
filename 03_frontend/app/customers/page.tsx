"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";

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

const UNIQUE_SALESPEOPLE: string[] = [];

export default function CustomersPage() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "customer" | "prospect">("all");
  const [salespersonFilter, setSalespersonFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "created" | "revenue">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch("/customers");
        if (!alive) return;
        setCustomers(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load customers.");
        setCustomers([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(customers.length / pageSize)),
    [pageSize]
  );

  return (
    <div className="customers-container">
      {/* Page Header */}
      <div className="customers-header">
        <div className="header-left">
          <h1>Customers</h1>
          <span className="customer-count">{customers.length} customers</span>
        </div>
        <div className="header-actions">
          <Link href="/customers/new" className="btn-add">
            + Create Customer
          </Link>
        </div>
      </div>

      {/* Controls Row */}
      <div className="controls-row">
        <input
          type="text"
          placeholder="Search customers..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="control-search"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "all" | "customer" | "prospect")}
          className="control-select"
        >
          <option value="all">All</option>
          <option value="customer">Customers</option>
          <option value="prospect">Prospects</option>
        </select>
        <select
          value={salespersonFilter}
          onChange={(e) => setSalespersonFilter(e.target.value)}
          className="control-select"
        >
          <option value="all">All</option>
          {UNIQUE_SALESPEOPLE.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "name" | "created" | "revenue")}
          className="control-select"
        >
          <option value="name">Name</option>
          <option value="created">Created</option>
          <option value="revenue">Revenue</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
          className="control-select"
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="control-select"
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <div className="pagination-controls">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="control-btn"
          >
            Prev
          </button>
          <span className="page-display">Page {page}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="control-btn"
          >
            Next
          </button>
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
            {customers.map((customer) => (
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

        .controls-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          margin-bottom: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          flex-wrap: wrap;
        }

        .control-search {
          flex: 1;
          min-width: 180px;
          padding: 10px 14px;
          font-size: 14px;
          color: #fff;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
        }

        .control-search::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .control-select {
          padding: 10px 14px;
          font-size: 14px;
          color: #fff;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          cursor: pointer;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
        }

        .control-btn {
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #fff;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .control-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }

        .control-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-display {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
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

