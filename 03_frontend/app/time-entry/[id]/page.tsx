"use client";

import { useState } from "react";
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

// Mock project options for allocation
const MOCK_PROJECTS = ["Main", "Line 1", "Line 2", "Shutdown", "Maintenance"];

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

// Placeholder REG/OT computation (UI-only, 40-hour baseline)
function computeRegOt(totalHours: number, dt: number) {
  const reg = Math.min(totalHours, 40);
  const otComputed = Math.max(totalHours - 40, 0);
  const otDisplay = Math.max(otComputed - dt, 0);
  return { reg, otDisplay };
}

type EntryMode = "Daily" | "Total";

interface WorkerHours {
  daily: number[];
  total: number;
  dt: number;
}

interface ProjectAllocation {
  id: string;
  project: string;
  hours: number;
}

export default function EnterHoursPage() {
  // Mock context data
  const mockContext = {
    customer: "Acme Manufacturing",
    jobOrder: "ORD-1042",
    weekEnding: "2026-02-08",
    status: "Draft",
  };

  const [entryMode, setEntryMode] = useState<EntryMode>("Daily");

  // Per-worker hours state
  const [workerHours, setWorkerHours] = useState<Record<string, WorkerHours>>(
    () => {
      const initial: Record<string, WorkerHours> = {};
      MOCK_WORKERS.forEach((w) => {
        initial[w.id] = {
          daily: [0, 0, 0, 0, 0, 0, 0],
          total: 0,
          dt: 0,
        };
      });
      return initial;
    }
  );

  // Per-worker project split toggle state
  const [splitExpanded, setSplitExpanded] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      MOCK_WORKERS.forEach((w) => {
        initial[w.id] = false;
      });
      return initial;
    }
  );

  // Per-worker project allocations state
  const [workerAllocations, setWorkerAllocations] = useState<
    Record<string, ProjectAllocation[]>
  >(() => {
    const initial: Record<string, ProjectAllocation[]> = {};
    MOCK_WORKERS.forEach((w) => {
      initial[w.id] = [];
    });
    return initial;
  });

  const handleDailyChange = (workerId: string, dayIndex: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setWorkerHours((prev) => {
      const worker = prev[workerId];
      const newDaily = [...worker.daily];
      newDaily[dayIndex] = numValue;
      return {
        ...prev,
        [workerId]: {
          ...worker,
          daily: newDaily,
        },
      };
    });
  };

  const handleTotalChange = (workerId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setWorkerHours((prev) => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        total: numValue,
      },
    }));
  };

  const handleDtChange = (workerId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setWorkerHours((prev) => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        dt: numValue,
      },
    }));
  };

  const getWorkerTotal = (workerId: string): number => {
    const worker = workerHours[workerId];
    if (entryMode === "Daily") {
      return worker.daily.reduce((sum, h) => sum + h, 0);
    }
    return worker.total;
  };

  const toggleSplit = (workerId: string) => {
    setSplitExpanded((prev) => ({
      ...prev,
      [workerId]: !prev[workerId],
    }));
  };

  const addAllocation = (workerId: string) => {
    setWorkerAllocations((prev) => ({
      ...prev,
      [workerId]: [
        ...prev[workerId],
        { id: `alloc-${Date.now()}`, project: MOCK_PROJECTS[0], hours: 0 },
      ],
    }));
  };

  const updateAllocationProject = (
    workerId: string,
    allocId: string,
    project: string
  ) => {
    setWorkerAllocations((prev) => ({
      ...prev,
      [workerId]: prev[workerId].map((a) =>
        a.id === allocId ? { ...a, project } : a
      ),
    }));
  };

  const updateAllocationHours = (
    workerId: string,
    allocId: string,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setWorkerAllocations((prev) => ({
      ...prev,
      [workerId]: prev[workerId].map((a) =>
        a.id === allocId ? { ...a, hours: numValue } : a
      ),
    }));
  };

  const removeAllocation = (workerId: string, allocId: string) => {
    setWorkerAllocations((prev) => ({
      ...prev,
      [workerId]: prev[workerId].filter((a) => a.id !== allocId),
    }));
  };

  const getAllocatedTotal = (workerId: string): number => {
    return workerAllocations[workerId].reduce((sum, a) => sum + a.hours, 0);
  };

  // Compute column count for allocation row colspan
  const getColSpan = (): number => {
    // Worker + Trade + (Daily days OR Total input) + Total display + REG + OT + DT
    if (entryMode === "Daily") {
      return 2 + 7 + 4; // 13
    }
    return 2 + 1 + 4; // 7
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "8px", color: "#f1f5f9" }}>
          Working Timesheet
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>
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
          backgroundColor: "#0b1220",
          border: "1px solid #1f2937",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "2px" }}>
            Customer
          </div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#e5e7eb" }}>
            {mockContext.customer}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "2px" }}>
            Job Order
          </div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#e5e7eb" }}>
            {mockContext.jobOrder}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "2px" }}>
            Week Ending
          </div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#e5e7eb" }}>
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
              backgroundColor: "#1e293b",
              color: getStatusColor(mockContext.status),
              border: `1px solid ${getStatusColor(mockContext.status)}40`,
            }}
          >
            {mockContext.status}
          </span>
        </div>
      </div>

      {/* Hours Entry Mode Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: 500, color: "#e5e7eb" }}>
          Hours Entry Mode:
        </span>
        <div
          style={{
            display: "inline-flex",
            borderRadius: "6px",
            overflow: "hidden",
            border: "1px solid #334155",
          }}
        >
          <button
            onClick={() => setEntryMode("Daily")}
            style={{
              padding: "6px 16px",
              fontSize: "13px",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              backgroundColor: entryMode === "Daily" ? "#2563eb" : "#0f172a",
              color: entryMode === "Daily" ? "#fff" : "#94a3b8",
            }}
          >
            Daily
          </button>
          <button
            onClick={() => setEntryMode("Total")}
            style={{
              padding: "6px 16px",
              fontSize: "13px",
              fontWeight: 500,
              border: "none",
              borderLeft: "1px solid #334155",
              cursor: "pointer",
              backgroundColor: entryMode === "Total" ? "#2563eb" : "#0f172a",
              color: entryMode === "Total" ? "#fff" : "#94a3b8",
            }}
          >
            Total
          </button>
        </div>
        <span style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
          (REG/OT placeholder: 40hr baseline, UI-only)
        </span>
      </div>

      {/* Hours Grid */}
      <div
        style={{
          border: "1px solid #1f2937",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#0f172a" }}>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderBottom: "1px solid #1f2937",
                  minWidth: "180px",
                  color: "#e5e7eb",
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
                  borderBottom: "1px solid #1f2937",
                  minWidth: "120px",
                  color: "#e5e7eb",
                }}
              >
                Trade
              </th>
              {entryMode === "Daily" &&
                DAYS.map((day) => (
                  <th
                    key={day}
                    style={{
                      padding: "12px 8px",
                      textAlign: "center",
                      fontSize: "13px",
                      fontWeight: 600,
                      borderBottom: "1px solid #1f2937",
                      width: "60px",
                      color: "#e5e7eb",
                    }}
                  >
                    {day}
                  </th>
                ))}
              {entryMode === "Total" && (
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: 600,
                    borderBottom: "1px solid #1f2937",
                    width: "80px",
                    color: "#e5e7eb",
                  }}
                >
                  Total
                </th>
              )}
              <th
                style={{
                  padding: "12px 8px",
                  textAlign: "center",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderBottom: "1px solid #1f2937",
                  width: "70px",
                  color: "#e5e7eb",
                }}
              >
                Total
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  textAlign: "center",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderBottom: "1px solid #1f2937",
                  width: "60px",
                  color: "#e5e7eb",
                }}
              >
                REG
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  textAlign: "center",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderBottom: "1px solid #1f2937",
                  width: "60px",
                  color: "#e5e7eb",
                }}
              >
                OT
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  textAlign: "center",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderBottom: "1px solid #1f2937",
                  width: "70px",
                  color: "#e5e7eb",
                }}
              >
                DT
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_WORKERS.map((worker, idx) => {
              const totalHours = getWorkerTotal(worker.id);
              const dt = workerHours[worker.id].dt;
              const { reg, otDisplay } = computeRegOt(totalHours, dt);
              const isExpanded = splitExpanded[worker.id];
              const allocations = workerAllocations[worker.id];
              const allocatedTotal = getAllocatedTotal(worker.id);
              const hasMismatch =
                allocations.length > 0 && allocatedTotal !== totalHours;

              return (
                <>
                  <tr
                    key={worker.id}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#0b1220" : "#0f172a",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        borderBottom: "1px solid #1f2937",
                        color: "#e5e7eb",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>{worker.name}</span>
                        <button
                          onClick={() => toggleSplit(worker.id)}
                          style={{
                            padding: "2px 8px",
                            fontSize: "11px",
                            fontWeight: 500,
                            border: "1px solid #334155",
                            borderRadius: "4px",
                            backgroundColor: isExpanded ? "#1e3a5f" : "#0f172a",
                            color: isExpanded ? "#60a5fa" : "#94a3b8",
                            cursor: "pointer",
                          }}
                        >
                          {isExpanded ? "▼ Split by Project" : "▶ Split by Project"}
                        </button>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "13px",
                        color: "#94a3b8",
                        borderBottom: "1px solid #1f2937",
                      }}
                    >
                      {worker.trade}
                    </td>
                    {entryMode === "Daily" &&
                      DAYS.map((day, dayIdx) => (
                        <td
                          key={day}
                          style={{
                            padding: "8px 4px",
                            textAlign: "center",
                            borderBottom: "1px solid #1f2937",
                          }}
                        >
                          <input
                            type="text"
                            value={workerHours[worker.id].daily[dayIdx] || ""}
                            onChange={(e) =>
                              handleDailyChange(worker.id, dayIdx, e.target.value)
                            }
                            style={{
                              width: "48px",
                              padding: "6px 4px",
                              textAlign: "center",
                              border: "1px solid #334155",
                              borderRadius: "4px",
                              fontSize: "13px",
                              backgroundColor: "#0b1220",
                              color: "#e5e7eb",
                            }}
                          />
                        </td>
                      ))}
                    {entryMode === "Total" && (
                      <td
                        style={{
                          padding: "8px 4px",
                          textAlign: "center",
                          borderBottom: "1px solid #1f2937",
                        }}
                      >
                        <input
                          type="text"
                          value={workerHours[worker.id].total || ""}
                          onChange={(e) =>
                            handleTotalChange(worker.id, e.target.value)
                          }
                          style={{
                            width: "60px",
                            padding: "6px 4px",
                            textAlign: "center",
                            border: "1px solid #334155",
                            borderRadius: "4px",
                            fontSize: "13px",
                            backgroundColor: "#0b1220",
                            color: "#e5e7eb",
                          }}
                        />
                      </td>
                    )}
                    {/* Total (computed display) */}
                    <td
                      style={{
                        padding: "12px 8px",
                        textAlign: "center",
                        fontSize: "14px",
                        fontWeight: 500,
                        borderBottom: "1px solid #1f2937",
                        color: "#e5e7eb",
                      }}
                    >
                      {totalHours}
                    </td>
                    {/* REG (read-only) */}
                    <td
                      style={{
                        padding: "12px 8px",
                        textAlign: "center",
                        fontSize: "13px",
                        borderBottom: "1px solid #1f2937",
                        color: "#94a3b8",
                      }}
                    >
                      {reg}
                    </td>
                    {/* OT (read-only, after DT reduction) */}
                    <td
                      style={{
                        padding: "12px 8px",
                        textAlign: "center",
                        fontSize: "13px",
                        borderBottom: "1px solid #1f2937",
                        color: "#94a3b8",
                      }}
                    >
                      {otDisplay}
                    </td>
                    {/* DT (editable) */}
                    <td
                      style={{
                        padding: "8px 4px",
                        textAlign: "center",
                        borderBottom: "1px solid #1f2937",
                      }}
                    >
                      <input
                        type="text"
                        value={workerHours[worker.id].dt || ""}
                        onChange={(e) => handleDtChange(worker.id, e.target.value)}
                        style={{
                          width: "48px",
                          padding: "6px 4px",
                          textAlign: "center",
                          border: "1px solid #2563eb",
                          borderRadius: "4px",
                          fontSize: "13px",
                          backgroundColor: "#1e3a5f",
                          color: "#e5e7eb",
                        }}
                      />
                    </td>
                  </tr>
                  {/* Project Allocation Row (expanded) */}
                  {isExpanded && (
                    <tr
                      key={`${worker.id}-alloc`}
                      style={{ backgroundColor: "#0f172a" }}
                    >
                      <td
                        colSpan={getColSpan()}
                        style={{
                          padding: "12px 16px 16px 40px",
                          borderBottom: "1px solid #1f2937",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: "#0b1220",
                            border: "1px solid #1f2937",
                            borderRadius: "6px",
                            padding: "12px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#e5e7eb",
                              marginBottom: "8px",
                            }}
                          >
                            Project / Cost-Code Allocation
                          </div>
                          {allocations.length > 0 && (
                            <table
                              style={{
                                width: "100%",
                                maxWidth: "400px",
                                borderCollapse: "collapse",
                                marginBottom: "8px",
                              }}
                            >
                              <thead>
                                <tr>
                                  <th
                                    style={{
                                      padding: "6px 8px",
                                      textAlign: "left",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      color: "#94a3b8",
                                      borderBottom: "1px solid #1f2937",
                                    }}
                                  >
                                    Project
                                  </th>
                                  <th
                                    style={{
                                      padding: "6px 8px",
                                      textAlign: "center",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      color: "#94a3b8",
                                      borderBottom: "1px solid #1f2937",
                                      width: "100px",
                                    }}
                                  >
                                    Allocated Hours
                                  </th>
                                  <th
                                    style={{
                                      padding: "6px 8px",
                                      textAlign: "center",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      color: "#94a3b8",
                                      borderBottom: "1px solid #1f2937",
                                      width: "40px",
                                    }}
                                  >
                                    &nbsp;
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {allocations.map((alloc) => (
                                  <tr key={alloc.id}>
                                    <td
                                      style={{
                                        padding: "6px 8px",
                                        borderBottom: "1px solid #1f2937",
                                      }}
                                    >
                                      <select
                                        value={alloc.project}
                                        onChange={(e) =>
                                          updateAllocationProject(
                                            worker.id,
                                            alloc.id,
                                            e.target.value
                                          )
                                        }
                                        style={{
                                          padding: "4px 8px",
                                          fontSize: "12px",
                                          border: "1px solid #334155",
                                          borderRadius: "4px",
                                          backgroundColor: "#0b1220",
                                          color: "#e5e7eb",
                                          width: "100%",
                                        }}
                                      >
                                        {MOCK_PROJECTS.map((proj) => (
                                          <option key={proj} value={proj}>
                                            {proj}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td
                                      style={{
                                        padding: "6px 8px",
                                        textAlign: "center",
                                        borderBottom: "1px solid #1f2937",
                                      }}
                                    >
                                      <input
                                        type="text"
                                        value={alloc.hours || ""}
                                        onChange={(e) =>
                                          updateAllocationHours(
                                            worker.id,
                                            alloc.id,
                                            e.target.value
                                          )
                                        }
                                        style={{
                                          width: "60px",
                                          padding: "4px 6px",
                                          textAlign: "center",
                                          border: "1px solid #334155",
                                          borderRadius: "4px",
                                          fontSize: "12px",
                                          backgroundColor: "#0b1220",
                                          color: "#e5e7eb",
                                        }}
                                      />
                                    </td>
                                    <td
                                      style={{
                                        padding: "6px 8px",
                                        textAlign: "center",
                                        borderBottom: "1px solid #1f2937",
                                      }}
                                    >
                                      <button
                                        onClick={() =>
                                          removeAllocation(worker.id, alloc.id)
                                        }
                                        style={{
                                          padding: "2px 6px",
                                          fontSize: "11px",
                                          border: "none",
                                          borderRadius: "3px",
                                          backgroundColor: "#7f1d1d",
                                          color: "#fca5a5",
                                          cursor: "pointer",
                                        }}
                                      >
                                        ✕
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          <button
                            onClick={() => addAllocation(worker.id)}
                            style={{
                              padding: "4px 10px",
                              fontSize: "12px",
                              fontWeight: 500,
                              border: "1px solid #334155",
                              borderRadius: "4px",
                              backgroundColor: "#0f172a",
                              color: "#e5e7eb",
                              cursor: "pointer",
                            }}
                          >
                            + Add Project
                          </button>
                          {/* Rollup Display */}
                          {allocations.length > 0 && (
                            <div
                              style={{
                                marginTop: "10px",
                                fontSize: "12px",
                                color: "#94a3b8",
                              }}
                            >
                              <span>
                                Allocated: {allocatedTotal} / Total: {totalHours}
                              </span>
                              {hasMismatch && (
                                <span
                                  style={{
                                    marginLeft: "12px",
                                    color: "#d97706",
                                    fontStyle: "italic",
                                  }}
                                >
                                  (Allocation does not match total hours)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
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
            backgroundColor: "#1e293b",
            color: "#64748b",
            border: "1px solid #334155",
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
            backgroundColor: "#1e293b",
            color: "#64748b",
            border: "1px solid #334155",
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
            backgroundColor: "#1e293b",
            color: "#64748b",
            border: "1px solid #334155",
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
            color: "#60a5fa",
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          ← Back to Time Entry
        </Link>
        <Link
          href="/orders/mock-order-id/timesheets"
          style={{
            color: "#64748b",
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
          color: "#64748b",
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
