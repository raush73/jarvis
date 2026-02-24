import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";
import * as path from "path";
import { TimesheetApprovalSubmitDto } from "./dto/timesheet-approval-submit.dto";
import { readPublicHtml, injectPublicWindowData } from "../ui/public/public-html.util";

export type TimesheetApprovalState =
  | {
      state: "APPROVABLE";
      customerName: string;
      orderName: string;
      payrollWeek: string;

      // Crew line items (worker-week)
      items: Array<{
        hoursEntryId: string;
        workerLabel: string; // for now: workerId (candidate has no name fields)
        totalHours: number;
      }>;

      totals: {
        totalWorkers: number;
        totalHours: number;
      };

      actions: { approve: true; reject: true };
    }
  | {
      state: "FINALIZED";
      result: "APPROVED" | "REJECTED";
      timestamp: string;
      message: string;

      // Optional snapshot so customer can still see the timesheet after finalization
      items?: Array<{
        hoursEntryId: string;
        workerLabel: string;
        totalHours: number;
        approvalStatus?: string;
        rejectionReason?: string | null;
      }>;

      totals?: {
        totalWorkers: number;
        totalHours: number;
        totalApproved?: number;
        totalRejected?: number;
      };
    }
  | {
      state: "INVALID";
      message: string;
    };

@Injectable()
export class MagicService {
  constructor(private readonly prisma: PrismaService) {}

  // UI-1: Customer Timesheet Approval (Magic Link Page)
  // CONTRACT STUB ONLY — no business logic yet
  async getTimesheetApprovalState(token: string): Promise<TimesheetApprovalState> {
  // DEV-only demo backing. Production remains stub.
  if (process.env.JARVIS_UI_DEMO !== "1") {
    return { state: "INVALID", message: "This approval link is not yet active." };
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const link = await this.prisma.magicLink.findFirst({
    where: { tokenHash, scope: "TIMESHEET_APPROVAL" },
    select: { orderId: true, usedAt: true },
  });

  if (!link?.orderId) return { state: "INVALID", message: "Invalid or expired link." };

// Used links should still be readable (FINALIZED instead of INVALID)
if (link.usedAt) {
  // Build a read-only snapshot for the customer to view after finalization
  const leadAny = await this.prisma.hoursEntry.findFirst({
    where: { orderId: link.orderId, type: "OFFICIAL" },
    select: { periodStart: true, periodEnd: true },
    orderBy: { createdAt: "asc" },
  });

  if (!leadAny) {
    return {
      state: "FINALIZED",
      result: "APPROVED",
      timestamp: link.usedAt.toISOString(),
      message: "Timesheet finalized.",
      items: [],
      totals: { totalWorkers: 0, totalHours: 0, totalApproved: 0, totalRejected: 0 },
    };
  }

  const rows = await this.prisma.hoursEntry.findMany({
    where: {
      orderId: link.orderId,
      type: "OFFICIAL",
      periodStart: leadAny.periodStart,
      periodEnd: leadAny.periodEnd,
    },
    select: { id: true, workerId: true, totalHours: true, approvalStatus: true, rejectionReason: true },
    orderBy: { createdAt: "asc" },
  });

  const items = rows.map((h) => ({
    hoursEntryId: h.id,
    workerLabel: h.workerId,
    totalHours: h.totalHours,
    approvalStatus: h.approvalStatus,
    rejectionReason: h.rejectionReason,
  }));

  const totalHours = items.reduce((sum, x) => sum + (Number(x.totalHours) || 0), 0);
  const totalApproved = rows.filter((r) => r.approvalStatus === "APPROVED").length;
  const totalRejected = rows.filter((r) => r.approvalStatus === "REJECTED").length;

  const result = totalApproved > 0 ? "APPROVED" : "REJECTED";
  const message =
    totalApproved > 0 && totalRejected > 0
      ? "Timesheet approved with exceptions."
      : totalApproved > 0
      ? "Timesheet approved."
      : "Timesheet rejected.";

  return {
    state: "FINALIZED",
    result,
    timestamp: link.usedAt.toISOString(),
    message,
    items,
    totals: { totalWorkers: items.length, totalHours, totalApproved, totalRejected },
  };
}

  const lead = await this.prisma.hoursEntry.findFirst({
    where: { orderId: link.orderId, approvalStatus: "PENDING", type: "OFFICIAL" },
    select: { periodStart: true, periodEnd: true },
  });

  if (!lead) return { state: "INVALID", message: "No pending timesheet found." };

  const hoursList = await this.prisma.hoursEntry.findMany({
    where: {
      orderId: link.orderId,
      approvalStatus: "PENDING",
      type: "OFFICIAL",
      periodStart: lead.periodStart,
      periodEnd: lead.periodEnd,
    },
    include: { order: { include: { customer: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (!hoursList.length) return { state: "INVALID", message: "No pending timesheet found." };

  const hours = hoursList[0];

  const weekLabel =
    new Date(hours.periodStart).toISOString().slice(0, 10) +
    " to " +
    new Date(hours.periodEnd).toISOString().slice(0, 10);

  return {
    state: "APPROVABLE",
    customerName: hours.order.customer?.name ?? "Customer",
    orderName: hours.orderId, // Order has no name field in schema; use id for now
    payrollWeek: weekLabel,

    items: hoursList.map((h) => ({
      hoursEntryId: h.id,
      workerLabel: h.workerId, // Candidate has no name fields; use id for now
      totalHours: h.totalHours,
    })),
    totals: {
      totalWorkers: hoursList.length,
      totalHours: hoursList.reduce((sum, h) => sum + (Number(h.totalHours) || 0), 0),
    },

    actions: { approve: true, reject: true },
  };
  }
  // UI-1: Submit approval / rejection (Magic Link)
  // CONTRACT STUB ONLY — no business logic yet
  async submitTimesheetApproval(
    token: string,
    body: TimesheetApprovalSubmitDto
  ): Promise<TimesheetApprovalState> {
    // DEV-only demo backing. Production remains stub.
    if (process.env.JARVIS_UI_DEMO !== "1") {
      return { state: "INVALID", message: "This approval link is not yet active." };
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const link = await this.prisma.magicLink.findFirst({
      where: {
        tokenHash,
        scope: "TIMESHEET_APPROVAL",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { orderId: true, usedAt: true },
    });

    if (!link?.orderId) {
      return { state: "INVALID", message: "Invalid or expired link." };
    }

    // Determine the crew-week by finding the lead pending OFFICIAL entry
    const lead = await this.prisma.hoursEntry.findFirst({
      where: { orderId: link.orderId, approvalStatus: "PENDING", type: "OFFICIAL" },
      select: { periodStart: true, periodEnd: true },
    });

    if (!lead) {
      return { state: "INVALID", message: "No pending timesheet found." };
    }

    const allPending = await this.prisma.hoursEntry.findMany({
      where: {
        orderId: link.orderId,
        approvalStatus: "PENDING",
        type: "OFFICIAL",
        periodStart: lead.periodStart,
        periodEnd: lead.periodEnd,
      },
      select: { id: true },
    });

    if (!allPending.length) {
      return { state: "INVALID", message: "No pending timesheet found." };
    }

    const allIds = allPending.map((h) => h.id);
    const exceptions = Array.isArray(body.exceptions) ? body.exceptions : [];
    const rejectIds = exceptions
      .filter((x) => x && x.action === "REJECT" && typeof x.hoursEntryId === "string")
      .map((x) => x.hoursEntryId);

    const rejectSet = new Set(rejectIds);

    // Enforce that exceptions must belong to this crew-week set
    const invalidReject = rejectIds.find((id) => !allIds.includes(id));
    if (invalidReject) {
      return { state: "INVALID", message: "One or more exception items are invalid for this timesheet." };
    }

    if (body.action === "REJECT") {
      // Reject ALL
      await this.prisma.hoursEntry.updateMany({
        where: { id: { in: allIds } },
        data: {
          approvalStatus: "REJECTED",
          rejectionReason: body.comment ?? null,
        },
      });
    } else {
      // APPROVE ALL except exceptions
      const approveIds = allIds.filter((id) => !rejectSet.has(id));

      if (approveIds.length) {
        await this.prisma.hoursEntry.updateMany({
          where: { id: { in: approveIds } },
          data: { approvalStatus: "APPROVED" },
        });
      }

      if (rejectIds.length) {
        // Apply per-item reason if provided; otherwise fall back to overall comment
        for (const ex of exceptions) {
          if (!ex || ex.action !== "REJECT") continue;
          await this.prisma.hoursEntry.updateMany({
            where: { id: ex.hoursEntryId },
            data: {
              approvalStatus: "REJECTED",
              rejectionReason: (ex.reason ?? body.comment) ?? null,
            },
          });
        }
      }
    }

    // Mark link used (single-use)
    await this.prisma.magicLink.updateMany({
      where: { tokenHash, scope: "TIMESHEET_APPROVAL", usedAt: null },
      data: { usedAt: new Date() },
    });

    return {
      state: "FINALIZED",
      result: body.action === "REJECT" ? "REJECTED" : "APPROVED",
      timestamp: new Date().toISOString(),
      message:
        body.action === "REJECT"
          ? "Timesheet rejected."
          : rejectIds.length
          ? "Timesheet approved with exceptions."
          : "Timesheet approved.",
    };
  }

  // UI-1: Mobile-first HTML page (presentation only)
  // NO eligibility decisions. NO calculations. Backend endpoints are the authority.
  async renderTimesheetApprovalPage(token: string): Promise<string> {
    // NOTE: token is present only so we can embed it into the page for fetch calls.
    // The UI must not interpret state — only render what the backend returns.

    const html = readPublicHtml(path.join(__dirname, "templates", "timesheet-approval.html"));
    return injectPublicWindowData(html, { token });
  }
}













