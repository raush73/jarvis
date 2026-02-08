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
  return { reg, otDisplay, otComputed };
}

type EntryMode = "Daily" | "Total";

interface WorkerHours {
  daily: number[];
  total: number;
  dt: number;
}

interface ProjectSplitRow {
  id: string;
  project: string;
  dailyHours: number[]; // For Daily mode: hours per day (Mon-Sun)
  totalHours: number; // For Total mode: total hours for this project
  otAllocation: number; // For Total mode OT allocation (editable when conditions met)
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

  // Per-worker project split rows state
  const [workerProjectSplits, setWorkerProjectSplits] = useState<
    Record<string, ProjectSplitRow[]>
  >(() => {
    const initial: Record<string, ProjectSplitRow[]> = {};
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

  // Project Split Row handlers
  const addProjectSplitRow = (workerId: string) => {
    setWorkerProjectSplits((prev) => ({
      ...prev,
      [workerId]: [
        ...prev[workerId],
        {
          id: `split-${Date.now()}`,
          project: MOCK_PROJECTS[0],
          dailyHours: [0, 0, 0, 0, 0, 0, 0],
          totalHours: 0,
          otAllocation: 0,
        },
      ],
    }));
  };

  const removeProjectSplitRow = (workerId: string, rowId: string) => {
    setWorkerProjectSplits((prev) => ({
      ...prev,
      [workerId]: prev[workerId].filter((r) => r.id !== rowId),
    }));
  };

  const updateProjectSplitProject = (
    workerId: string,
    rowId: string,
    project: string
  ) => {
    setWorkerProjectSplits((prev) => ({
      ...prev,
      [workerId]: prev[workerId].map((r) =>
        r.id === rowId ? { ...r, project } : r
      ),
    }));
  };

  const updateProjectSplitDailyHours = (
    workerId: string,
    rowId: string,
    dayIndex: number,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setWorkerProjectSplits((prev) => ({
      ...prev,
      [workerId]: prev[workerId].map((r) => {
        if (r.id === rowId) {
          const newDailyHours = [...r.dailyHours];
          newDailyHours[dayIndex] = numValue;
          return { ...r, dailyHours: newDailyHours };
        }
        return r;
      }),
    }));
  };

  const updateProjectSplitTotalHours = (
    workerId: string,
    rowId: string,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setWorkerProjectSplits((prev) => ({
      ...prev,
      [workerId]: prev[workerId].map((r) =>
        r.id === rowId ? { ...r, totalHours: numValue } : r
      ),
    }));
  };

  const updateProjectSplitOtAllocation = (
    workerId: string,
    rowId: string,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setWorkerProjectSplits((prev) => ({
      ...prev,
      [workerId]: prev[workerId].map((r) =>
        r.id === rowId ? { ...r, otAllocation: numValue } : r
      ),
    }));
  };

  // Compute project split row total (Daily mode: sum of dailyHours)
  const getProjectSplitRowTotal = (row: ProjectSplitRow): number => {
    return row.dailyHours.reduce((sum, h) => sum + h, 0);
  };

  // Compute worker total from project splits
  const getWorkerTotalFromProjects = (workerId: string): number => {
    const splits = workerProjectSplits[workerId];
    if (entryMode === "Daily") {
      return splits.reduce((sum, r) => sum + getProjectSplitRowTotal(r), 0);
    }
    return splits.reduce((sum, r) => sum + r.totalHours, 0);
  };

  // Compute total allocated OT from project splits (Total mode only)
  const getAllocatedOt = (workerId: string): number => {
    return workerProjectSplits[workerId].reduce((sum, r) => sum + r.otAllocation, 0);
  };

  // Check if OT allocation should be editable (Total mode, >=2 projects, worker total > 40)
  const isOtAllocationEditable = (workerId: string): boolean => {
    if (entryMode !== "Total") return false;
    const splits = workerProjectSplits[workerId];
    if (splits.length < 2) return false;
    const workerTotal = getWorkerTotal(workerId);
    return workerTotal > 40;
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
              const { reg, otDisplay, otComputed } = computeRegOt(totalHours, dt);
              const isExpanded = splitExpanded[worker.id];
              const projectSplits = workerProjectSplits[worker.id];
              const workerTotalFromProjects = getWorkerTotalFromProjects(worker.id);
              const otEditable = isOtAllocationEditable(worker.id);
              const allocatedOt = getAllocatedOt(worker.id);

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
                  {/* Project Split Panel (expanded) */}
                  {isExpanded && (
                    <tr
                      key={`${worker.id}-split`}
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
                              marginBottom: "4px",
                            }}
                          >
                            Project Split Entry
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#64748b",
                              fontStyle: "italic",
                              marginBottom: "12px",
                            }}
                          >
                            When using Project Split, enter project hours below. Main row entry remains available in this UI shell.
                          </div>

                          {/* Daily Mode: Project | Mon-Sun | Row Total */}
                          {entryMode === "Daily" && projectSplits.length > 0 && (
                            <div style={{ overflowX: "auto", marginBottom: "8px" }}>
                              <table
                                style={{
                                  borderCollapse: "collapse",
                                  minWidth: "700px",
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
                                        minWidth: "120px",
                                      }}
                                    >
                                      Project
                                    </th>
                                    {DAYS.map((day) => (
                                      <th
                                        key={day}
                                        style={{
                                          padding: "6px 4px",
                                          textAlign: "center",
                                          fontSize: "11px",
                                          fontWeight: 600,
                                          color: "#94a3b8",
                                          borderBottom: "1px solid #1f2937",
                                          width: "55px",
                                        }}
                                      >
                                        {day}
                                      </th>
                                    ))}
                                    <th
                                      style={{
                                        padding: "6px 8px",
                                        textAlign: "center",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: "#94a3b8",
                                        borderBottom: "1px solid #1f2937",
                                        width: "70px",
                                      }}
                                    >
                                      Row Total
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
                                  {projectSplits.map((row) => {
                                    const rowTotal = getProjectSplitRowTotal(row);
                                    return (
                                      <tr key={row.id}>
                                        <td
                                          style={{
                                            padding: "6px 8px",
                                            borderBottom: "1px solid #1f2937",
                                          }}
                                        >
                                          <select
                                            value={row.project}
                                            onChange={(e) =>
                                              updateProjectSplitProject(
                                                worker.id,
                                                row.id,
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
                                        {DAYS.map((day, dayIdx) => (
                                          <td
                                            key={day}
                                            style={{
                                              padding: "6px 4px",
                                              textAlign: "center",
                                              borderBottom: "1px solid #1f2937",
                                            }}
                                          >
                                            <input
                                              type="text"
                                              value={row.dailyHours[dayIdx] || ""}
                                              onChange={(e) =>
                                                updateProjectSplitDailyHours(
                                                  worker.id,
                                                  row.id,
                                                  dayIdx,
                                                  e.target.value
                                                )
                                              }
                                              style={{
                                                width: "42px",
                                                padding: "4px 2px",
                                                textAlign: "center",
                                                border: "1px solid #334155",
                                                borderRadius: "4px",
                                                fontSize: "12px",
                                                backgroundColor: "#0b1220",
                                                color: "#e5e7eb",
                                              }}
                                            />
                                          </td>
                                        ))}
                                        <td
                                          style={{
                                            padding: "6px 8px",
                                            textAlign: "center",
                                            fontSize: "12px",
                                            fontWeight: 500,
                                            color: "#e5e7eb",
                                            borderBottom: "1px solid #1f2937",
                                          }}
                                        >
                                          {rowTotal}
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
                                              removeProjectSplitRow(worker.id, row.id)
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
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Total Mode: Project | Total Hours | (OT Allocation if editable) */}
                          {entryMode === "Total" && projectSplits.length > 0 && (
                            <div style={{ marginBottom: "8px" }}>
                              <table
                                style={{
                                  borderCollapse: "collapse",
                                  width: "100%",
                                  maxWidth: otEditable ? "500px" : "350px",
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
                                        minWidth: "120px",
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
                                      Total Hours
                                    </th>
                                    {otEditable && (
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
                                        OT Allocation
                                      </th>
                                    )}
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
                                  {projectSplits.map((row) => (
                                    <tr key={row.id}>
                                      <td
                                        style={{
                                          padding: "6px 8px",
                                          borderBottom: "1px solid #1f2937",
                                        }}
                                      >
                                        <select
                                          value={row.project}
                                          onChange={(e) =>
                                            updateProjectSplitProject(
                                              worker.id,
                                              row.id,
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
                                          value={row.totalHours || ""}
                                          onChange={(e) =>
                                            updateProjectSplitTotalHours(
                                              worker.id,
                                              row.id,
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
                                      {otEditable && (
                                        <td
                                          style={{
                                            padding: "6px 8px",
                                            textAlign: "center",
                                            borderBottom: "1px solid #1f2937",
                                          }}
                                        >
                                          <input
                                            type="text"
                                            value={row.otAllocation || ""}
                                            onChange={(e) =>
                                              updateProjectSplitOtAllocation(
                                                worker.id,
                                                row.id,
                                                e.target.value
                                              )
                                            }
                                            style={{
                                              width: "60px",
                                              padding: "4px 6px",
                                              textAlign: "center",
                                              border: "1px solid #2563eb",
                                              borderRadius: "4px",
                                              fontSize: "12px",
                                              backgroundColor: "#1e3a5f",
                                              color: "#e5e7eb",
                                            }}
                                          />
                                        </td>
                                      )}
                                      <td
                                        style={{
                                          padding: "6px 8px",
                                          textAlign: "center",
                                          borderBottom: "1px solid #1f2937",
                                        }}
                                      >
                                        <button
                                          onClick={() =>
                                            removeProjectSplitRow(worker.id, row.id)
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
                            </div>
                          )}

                          <button
                            onClick={() => addProjectSplitRow(worker.id)}
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
                          {projectSplits.length > 0 && (
                            <div
                              style={{
                                marginTop: "10px",
                                fontSize: "12px",
                                color: "#94a3b8",
                              }}
                            >
                              <span>
                                Worker Total from Projects: {workerTotalFromProjects}
                              </span>
                            </div>
                          )}

                          {/* OT Allocation Summary (Total mode only, when editable) */}
                          {entryMode === "Total" && otEditable && projectSplits.length > 0 && (
                            <div
                              style={{
                                marginTop: "8px",
                                fontSize: "12px",
                                color: "#94a3b8",
                              }}
                            >
                              <span>
                                Computed OT (UI-only): {otComputed}
                              </span>
                              <span style={{ marginLeft: "16px" }}>
                                Allocated OT: {allocatedOt}
                              </span>
                              {allocatedOt !== otComputed && (
                                <span
                                  style={{
                                    marginLeft: "12px",
                                    color: "#d97706",
                                    fontStyle: "italic",
                                  }}
                                >
                                  (Allocated OT does not match computed OT)
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
