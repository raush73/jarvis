"use client";

import Link from "next/link";

// Mock data for working timesheets (UI-only)
const MOCK_WORKING_TIMESHEETS = [
  {
    id: "wts-001",
    customer: "Acme Manufacturing",
    jobOrder: "ORD-1042",
    weekEnding: "2026-02-08",
    workerCount: 12,
    status: "Draft",
  },
  {
    id: "wts-002",
    customer: "Summit Industries",
    jobOrder: "ORD-1038",
    weekEnding: "2026-02-08",
    workerCount: 8,
    status: "Submitted",
  },
  {
    id: "wts-003",
    customer: "Precision Parts Co",
    jobOrder: "ORD-1045",
    weekEnding: "2026-02-08",
    workerCount: 5,
    status: "Needs Customer",
  },
  {
    id: "wts-004",
    customer: "Delta Logistics",
    jobOrder: "ORD-1039",
    weekEnding: "2026-02-08",
    workerCount: 15,
    status: "Ready to Snapshot",
  },
  {
    id: "wts-005",
    customer: "Northern Steel",
    jobOrder: "ORD-1041",
    weekEnding: "2026-02-08",
    workerCount: 10,
    status: "Draft",
  },
  {
    id: "wts-006",
    customer: "Midwest Assembly",
    jobOrder: "ORD-1044",
    weekEnding: "2026-02-08",
    workerCount: 7,
    status: "Submitted",
  },
  {
    id: "wts-007",
    customer: "Harbor Freight Services",
    jobOrder: "ORD-1046",
    weekEnding: "2026-02-08",
    workerCount: 9,
    status: "Draft",
  },
  {
    id: "wts-008",
    customer: "Central Fabrication",
    jobOrder: "ORD-1047",
    weekEnding: "2026-02-08",
    workerCount: 6,
    status: "Needs Customer",
  },
];

function getStatusColor(status: string): string {
  switch (status) {
    case "Draft":
      return "#6b7280";
    case "Submitted":
      return "#2563eb";
    case "Needs Customer":
      return "#d97706";
    case "Ready to Snapshot":
      return "#059669";
    default:
      return "#6b7280";
  }
}

export default function TimeEntryHubPage() {
  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "8px" }}>
          Time Entry
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px" }}>
          Internal MW4H hub of open working timesheets.
        </p>
      </div>

      {/* Working Timesheets Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {MOCK_WORKING_TIMESHEETS.map((ts) => (
          <div
            key={ts.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "20px",
              backgroundColor: "#fff",
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}
              >
                {ts.customer}
              </div>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>
                {ts.jobOrder}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div style={{ fontSize: "13px", color: "#6b7280" }}>
                Week Ending: {ts.weekEnding}
              </div>
              <div style={{ fontSize: "13px", color: "#6b7280" }}>
                {ts.workerCount} workers
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 500,
                  backgroundColor: `${getStatusColor(ts.status)}15`,
                  color: getStatusColor(ts.status),
                }}
              >
                {ts.status}
              </span>

              <Link
                href={`/time-entry/${ts.id}`}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Enter Hours
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Boundary Note */}
      <div
        style={{
          padding: "16px 20px",
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          color: "#6b7280",
          fontSize: "13px",
          lineHeight: "1.6",
        }}
      >
        Snapshots remain under Customer → Orders → Order → Timesheets.
        <br />
        Time Entry is for working timesheets only.
      </div>
    </div>
  );
}
