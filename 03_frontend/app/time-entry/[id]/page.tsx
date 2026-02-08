"use client";

import { useState } from "react";
import Link from "next/link";

// Mock job/order options for dropdown
const MOCK_JOB_OPTIONS = [
  { id: "job1", name: "ORD-1042 - Main Assembly" },
  { id: "job2", name: "ORD-1043 - Line 2 Support" },
  { id: "job3", name: "ORD-1044 - Shutdown Crew" },
  { id: "job4", name: "ORD-1045 - Maintenance" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface JobRow {
  id: string;
  jobId: string;
  dailyHours: number[]; // Mon-Sun raw hours
}

interface EmployeeData {
  id: string;
  name: string;
  trade: string;
  jobRows: JobRow[];
}

// Compute derived REG/OT/DT for an employee across all job rows
// Chronological allocation: Mon→Sun, within day: top row to bottom row
// First 40 hours = REG, remaining = OT, DT = 0 for now
function computeEmployeeTotals(jobRows: JobRow[]): {
  totalHours: number;
  reg: number;
  ot: number;
  dt: number;
  jobBreakdown: { jobId: string; reg: number; ot: number; dt: number; total: number }[];
} {
  let runningTotal = 0;
  const jobBreakdown: { jobId: string; reg: number; ot: number; dt: number; total: number }[] = [];

  // Initialize breakdown for each job row
  jobRows.forEach((row) => {
    jobBreakdown.push({ jobId: row.id, reg: 0, ot: 0, dt: 0, total: 0 });
  });

  // Iterate chronologically: Mon→Sun, within day: row order
  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    for (let rowIdx = 0; rowIdx < jobRows.length; rowIdx++) {
      const hours = jobRows[rowIdx].dailyHours[dayIdx] || 0;
      if (hours <= 0) continue;

      const breakdown = jobBreakdown[rowIdx];
      breakdown.total += hours;

      // Allocate hours: first 40 total = REG, rest = OT
      const hoursBeforeThisCell = runningTotal;
      const hoursAfterThisCell = runningTotal + hours;

      if (hoursBeforeThisCell >= 40) {
        // All OT
        breakdown.ot += hours;
      } else if (hoursAfterThisCell <= 40) {
        // All REG
        breakdown.reg += hours;
      } else {
        // Split: some REG, some OT
        const regPortion = 40 - hoursBeforeThisCell;
        const otPortion = hours - regPortion;
        breakdown.reg += regPortion;
        breakdown.ot += otPortion;
      }

      runningTotal = hoursAfterThisCell;
    }
  }

  const totalHours = runningTotal;
  const reg = Math.min(totalHours, 40);
  const ot = Math.max(totalHours - 40, 0);
  const dt = 0;

  return { totalHours, reg, ot, dt, jobBreakdown };
}

export default function TimeEntryPage() {
  // Mock context data
  const mockContext = {
    jobSite: "Acme Manufacturing - Plant A",
    customer: "Acme Manufacturing",
    weekEnding: "2026-02-08",
    status: "Working",
  };

  // Initialize with 2 mock employees, each with 1 default job row
  const [employees, setEmployees] = useState<EmployeeData[]>([
    {
      id: "emp1",
      name: "John Martinez",
      trade: "Welder",
      jobRows: [
        {
          id: "emp1-job1",
          jobId: "job1",
          dailyHours: [8, 8, 8, 8, 8, 0, 0],
        },
      ],
    },
    {
      id: "emp2",
      name: "Sarah Chen",
      trade: "Assembler",
      jobRows: [
        {
          id: "emp2-job1",
          jobId: "job1",
          dailyHours: [10, 10, 10, 10, 10, 4, 0],
        },
      ],
    },
  ]);

  // Add a new job row for an employee
  const addJobRow = (employeeId: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== employeeId) return emp;
        const newRowId = `${emp.id}-job${emp.jobRows.length + 1}-${Date.now()}`;
        return {
          ...emp,
          jobRows: [
            ...emp.jobRows,
            {
              id: newRowId,
              jobId: "job2",
              dailyHours: [0, 0, 0, 0, 0, 0, 0],
            },
          ],
        };
      })
    );
  };

  // Remove a job row for an employee
  const removeJobRow = (employeeId: string, rowId: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== employeeId) return emp;
        // Don't remove if it's the only row
        if (emp.jobRows.length <= 1) return emp;
        return {
          ...emp,
          jobRows: emp.jobRows.filter((r) => r.id !== rowId),
        };
      })
    );
  };

  // Update job selection for a row
  const updateJobSelection = (employeeId: string, rowId: string, jobId: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== employeeId) return emp;
        return {
          ...emp,
          jobRows: emp.jobRows.map((r) =>
            r.id === rowId ? { ...r, jobId } : r
          ),
        };
      })
    );
  };

  // Update daily hours for a job row
  const updateDailyHours = (
    employeeId: string,
    rowId: string,
    dayIdx: number,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== employeeId) return emp;
        return {
          ...emp,
          jobRows: emp.jobRows.map((r) => {
            if (r.id !== rowId) return r;
            const newDailyHours = [...r.dailyHours];
            newDailyHours[dayIdx] = numValue;
            return { ...r, dailyHours: newDailyHours };
          }),
        };
      })
    );
  };

  // Get job name by id
  const getJobName = (jobId: string): string => {
    const job = MOCK_JOB_OPTIONS.find((j) => j.id === jobId);
    return job ? job.name : "Unknown Job";
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header Card */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 mb-6">
        <div className="flex flex-wrap items-center gap-6 mb-4">
          <div>
            <div className="text-xs text-slate-400 mb-1">Job Site</div>
            <div className="text-base font-medium text-slate-100">
              {mockContext.jobSite}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Customer</div>
            <div className="text-base font-medium text-slate-100">
              {mockContext.customer}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Week Ending</div>
            <div className="text-base font-medium text-slate-100">
              {mockContext.weekEnding}
            </div>
          </div>
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-amber-900/50 text-amber-400 border border-amber-700">
              {mockContext.status}
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-400">
          Working sheet — snapshot generated after approval
        </p>
      </div>

      {/* Employee Sections */}
      {employees.map((employee) => {
        const totals = computeEmployeeTotals(employee.jobRows);

        return (
          <div
            key={employee.id}
            className="bg-slate-900 border border-slate-700 rounded-lg mb-6 overflow-hidden"
          >
            {/* Employee Header */}
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-100">
                    {employee.name}
                  </span>
                  <span className="text-sm text-slate-400 ml-3">
                    {employee.trade}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Employee Weekly: REG {totals.reg} | OT {totals.ot} | DT {totals.dt} | Total {totals.totalHours}
                </div>
              </div>
            </div>

            {/* Job Rows Grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 border-b border-slate-700 min-w-[200px]">
                      Job/Order
                    </th>
                    {DAYS.map((day) => (
                      <th
                        key={day}
                        className="px-2 py-2 text-center text-xs font-medium text-slate-400 border-b border-slate-700 w-16"
                      >
                        {day}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-center text-xs font-medium text-slate-400 border-b border-slate-700 w-14">
                      Total
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-slate-400 border-b border-slate-700 w-14">
                      REG
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-slate-400 border-b border-slate-700 w-14">
                      OT
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-slate-400 border-b border-slate-700 w-14">
                      DT
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-slate-400 border-b border-slate-700 w-10">
                      &nbsp;
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employee.jobRows.map((row, rowIdx) => {
                    const rowTotal = row.dailyHours.reduce((s, h) => s + h, 0);
                    const breakdown = totals.jobBreakdown[rowIdx];
                    const isFirstRow = rowIdx === 0;

                    return (
                      <tr key={row.id} className="border-b border-slate-700/50">
                        <td className="px-4 py-2">
                          {isFirstRow ? (
                            <span className="text-sm text-slate-200">
                              {getJobName(row.jobId)}
                            </span>
                          ) : (
                            <select
                              value={row.jobId}
                              onChange={(e) =>
                                updateJobSelection(employee.id, row.id, e.target.value)
                              }
                              className="w-full px-2 py-1 text-sm bg-slate-800 border border-slate-600 rounded text-slate-200"
                            >
                              {MOCK_JOB_OPTIONS.map((job) => (
                                <option key={job.id} value={job.id}>
                                  {job.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        {DAYS.map((day, dayIdx) => (
                          <td key={day} className="px-1 py-2 text-center">
                            <input
                              type="text"
                              value={row.dailyHours[dayIdx] || ""}
                              onChange={(e) =>
                                updateDailyHours(employee.id, row.id, dayIdx, e.target.value)
                              }
                              className="w-12 px-1 py-1 text-center text-sm bg-slate-800 border border-slate-600 rounded text-slate-200"
                            />
                          </td>
                        ))}
                        <td className="px-2 py-2 text-center text-sm font-medium text-slate-200">
                          {rowTotal}
                        </td>
                        <td className="px-2 py-2 text-center text-sm text-slate-400">
                          {breakdown?.reg || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-sm text-slate-400">
                          {breakdown?.ot || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-sm text-slate-400">
                          {breakdown?.dt || 0}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {!isFirstRow && (
                            <button
                              onClick={() => removeJobRow(employee.id, row.id)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Add Job Control Row */}
            <div className="px-4 py-3 border-t border-slate-700/50">
              <button
                onClick={() => addJobRow(employee.id)}
                className="text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-600 rounded px-3 py-1"
              >
                + Add Job
              </button>
            </div>
          </div>
        );
      })}

      {/* Bottom Actions (disabled UI shell) */}
      <div className="flex gap-3 mb-6">
        <button
          disabled
          className="px-5 py-2 text-sm font-medium bg-slate-800 text-slate-500 border border-slate-700 rounded cursor-not-allowed"
        >
          Save Draft
        </button>
        <button
          disabled
          className="px-5 py-2 text-sm font-medium bg-slate-800 text-slate-500 border border-slate-700 rounded cursor-not-allowed"
        >
          Generate Snapshot
        </button>
        <button
          disabled
          className="px-5 py-2 text-sm font-medium bg-slate-800 text-slate-500 border border-slate-700 rounded cursor-not-allowed"
        >
          Mark Ready for Payroll
        </button>
      </div>
      <p className="text-xs text-slate-500 mb-6">UI shell</p>

      {/* Navigation */}
      <div className="flex gap-6 items-center">
        <Link
          href="/time-entry"
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          ← Back to Time Entry
        </Link>
      </div>
    </div>
  );
}
