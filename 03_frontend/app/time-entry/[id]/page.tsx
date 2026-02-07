"use client";

import Link from "next/link";

// Mock workers for the hours grid (UI-only)
const MOCK_WORKERS = [
  { id: "w1", name: "John Martinez", trade: "Welder" },
  { id: "w2", name: "Sarah Chen", trade: "Assembler" },
  { id: "w3", name: "Michael Brown", trade: "Machine Operator" },
  { id: "w4", name: "Emily Davis", trade: "Quality Inspector" },
  { id: "w5", name: "Robert Wilson", trade: "Forklift Operator" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

export default function EnterHoursPage() {
  // Mock context data
  const mockContext = {
    customer: "Acme Manufacturing",
    jobOrder: "ORD-1042",
    weekEnding: "2026-02-08",
    status: "Draft",
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "8px" }}>
          Working Timesheet
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px" }}>
          Enter hours for this working timesheet before snapshot.
        </p>
      </div>

      {/* Context Row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "24px",
          alignItems: "center",
          padding: "16px 20px",
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "2px" }}>
            Customer
          </div>
          <div style={{ fontSize: "14px", fontWeight: 500 }}>
            {mockContext.customer}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "2px" }}>
            Job Order
          </div>
          <div style={{ fontSize: "14px", fontWeight: 500 }}>
            {mockContext.jobOrder}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "2px" }}>
            Week Ending
          </div>
          <div style={{ fontSize: "14px", fontWeight: 500 }}>
            {mockContext.weekEnding}
          </div>
        </div>
        <div>
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 500,
              backgroundColor: `${getStatusColor(mockContext.status)}15`,
              color: getStatusColor(mockContext.status),
            }}
          >
            {mockContext.status}
          </span>
        </div>
      </div>

      {/* Hours Grid */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderBottom: "1px solid #e5e7eb",
                  minWidth: "180px",
                }}
              >
                Worker
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderBottom: "1px solid #e5e7eb",
                  minWidth: "120px",
                }}
              >
                Trade
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: 600,
                    borderBottom: "1px solid #e5e7eb",
                    width: "60px",
                  }}
                >
                  {day}
                </th>
              ))}
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "center",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderBottom: "1px solid #e5e7eb",
                  width: "70px",
                }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_WORKERS.map((worker, idx) => (
              <tr
                key={worker.id}
                style={{
                  backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                }}
              >
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  {worker.name}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: "13px",
                    color: "#6b7280",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  {worker.trade}
                </td>
                {DAYS.map((day) => (
                  <td
                    key={day}
                    style={{
                      padding: "8px 4px",
                      textAlign: "center",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <input
                      type="text"
                      style={{
                        width: "48px",
                        padding: "6px 4px",
                        textAlign: "center",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        fontSize: "13px",
                      }}
                    />
                  </td>
                ))}
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 500,
                    borderBottom: "1px solid #e5e7eb",
                    color: "#6b7280",
                  }}
                >
                  0
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions (disabled) */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <button
          disabled
          style={{
            padding: "10px 20px",
            backgroundColor: "#e5e7eb",
            color: "#9ca3af",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "not-allowed",
          }}
        >
          Save Draft
        </button>
        <button
          disabled
          style={{
            padding: "10px 20px",
            backgroundColor: "#e5e7eb",
            color: "#9ca3af",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "not-allowed",
          }}
        >
          Submit to Customer
        </button>
        <button
          disabled
          style={{
            padding: "10px 20px",
            backgroundColor: "#e5e7eb",
            color: "#9ca3af",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "not-allowed",
          }}
        >
          Ready to Snapshot
        </button>
      </div>

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <Link
          href="/time-entry"
          style={{
            color: "#2563eb",
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          ← Back to Time Entry
        </Link>
        <Link
          href="/orders/mock-order-id/timesheets"
          style={{
            color: "#9ca3af",
            fontSize: "13px",
            textDecoration: "none",
          }}
        >
          View Snapshot Timesheets (read-only)
        </Link>
      </div>

      {/* Boundary Helper Text */}
      <div
        style={{
          color: "#9ca3af",
          fontSize: "13px",
          lineHeight: "1.6",
        }}
      >
        This is a working timesheet.
        <br />
        Snapshots are immutable and created elsewhere.
      </div>
    </div>
  );
}
