import { Controller, Get, Post, Body, Header, Query, HttpException, HttpStatus } from '@nestjs/common';
import * as path from 'path';
import { PrismaService } from '../../../prisma/prisma.service';
import { readHtml, injectWindowData } from '../ui-html.util';
import { assertUiUnlockedOrThrow } from '../ui-lock.util';
import { Roles } from '../../../auth/authz/authz.decorators';

/**
 * UI-10: Crew-Week Approval Action Page
 *
 * Consumes SAME snapshot contract as UI-9 (orderId + weekStart).
 * Allows APPROVE or REJECT action with optional note.
 * Performs EXACTLY ONE write (updateMany on HoursEntry.approvalStatus).
 * Idempotent: re-approving already approved entries = no-op success.
 * Blocks conflicting state: cannot approve if entries are already rejected (and vice versa).
 *
 * Route: GET  /ui/internal/ui10/approval-action?orderId=<id>&weekStart=<YYYY-MM-DD>
 * Route: POST /ui/internal/ui10/approval-action (body: { orderId, weekStart, action, note? })
 */
@Controller('ui/internal/ui10')
export class Ui10Controller {
  constructor(private readonly prisma: PrismaService) {}

  @Get('approval-action')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Roles('admin')
  async renderApprovalPage(
    @Query('orderId') orderId?: string,
    @Query('weekStart') weekStart?: string,
  ): Promise<string> {
    // Lock check
    try {
      await assertUiUnlockedOrThrow({ orderId: orderId!, weekStart: weekStart! });
    } catch {
      return injectWindowData('', { ok: false, errorId: 'JAR-LOCKED', reason: 'FORCE_SMOKE_TEST' });
    }

    const filePath = path.join(__dirname, '../templates/ui10-approval-action.html');
    const html = readHtml(filePath);

    // If params missing, return static HTML (placeholder state)
    if (!orderId || !weekStart) {
      return html;
    }

    // Validate weekStart format (YYYY-MM-DD representing MONDAY)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      return html;
    }

    // MW4H Payroll Week boundaries (LOCKED):
    // - Week starts: Monday 00:00:00.000Z
    // - Week ends:   Sunday 23:59:59 (DB boundary: next Monday 00:00:00.000Z exclusive)
    const periodStart = new Date(`${weekStart}T00:00:00.000Z`);
    const periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      return html;
    }

    try {
      // Fetch ALL official HoursEntry rows for crew-week (any approval status)
      const entries = await this.prisma.hoursEntry.findMany({
        where: {
          orderId,
          type: 'OFFICIAL',
          AND: [
            { periodEnd: { gt: periodStart } },
            { periodStart: { lt: periodEnd } },
          ],
        },
        select: {
          id: true,
          workerId: true,
          totalHours: true,
          approvalStatus: true,
        },
      });

      // Compute current state summary
      const statusCounts = {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
      };
      for (const e of entries) {
        if (e.approvalStatus in statusCounts) {
          statusCounts[e.approvalStatus as keyof typeof statusCounts]++;
        }
      }

      // Build items array (same structure as UI-9 for consistency)
      const items = entries
        .map((e) => ({
          id: e.id,
          workerLabel: e.workerId,
          totalHours: typeof e.totalHours === 'number' ? e.totalHours : 0,
          status: e.approvalStatus,
        }))
        .sort((a, b) => a.workerLabel.localeCompare(b.workerLabel));

      const totalWorkers = items.length;
      const totalHours = items.reduce((sum, item) => sum + item.totalHours, 0);

      // UI display dates
      const weekEndingSunday = new Date(periodStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      const periodStartDisplay = periodStart.toISOString().slice(0, 10);
      const periodEndDisplay = weekEndingSunday.toISOString().slice(0, 10);

      // Determine current state for action buttons
      // - If any REJECTED exists, cannot APPROVE (conflicting)
      // - If any APPROVED exists, cannot REJECT (conflicting)
      // - If all same status, action is idempotent
      const currentState =
        statusCounts.REJECTED > 0 && statusCounts.APPROVED === 0 && statusCounts.PENDING === 0
          ? 'ALL_REJECTED'
          : statusCounts.APPROVED > 0 && statusCounts.REJECTED === 0 && statusCounts.PENDING === 0
            ? 'ALL_APPROVED'
            : statusCounts.PENDING > 0 && statusCounts.REJECTED === 0 && statusCounts.APPROVED === 0
              ? 'ALL_PENDING'
              : 'MIXED';

      const data = {
        orderId,
        weekStart,
        periodStart: periodStartDisplay,
        periodEnd: periodEndDisplay,
        items,
        totalWorkers,
        totalHours,
        statusCounts,
        currentState,
      };

      return injectWindowData(html, data);
    } catch {
      return html;
    }
  }

  @Post('approval-action')
  @Header('Content-Type', 'application/json')
  @Roles('admin')
  async submitApprovalAction(
    @Body() body: { orderId?: string; weekStart?: string; action?: string; note?: string },
  ): Promise<{ ok: boolean; message: string; updatedCount?: number }> {
    const { orderId, weekStart, action, note } = body;

    // Validate required params
    if (!orderId || !weekStart || !action) {
      throw new HttpException(
        { ok: false, message: 'Missing required parameters: orderId, weekStart, action' },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate action
    if (action !== 'APPROVE' && action !== 'REJECT') {
      throw new HttpException(
        { ok: false, message: 'Invalid action. Must be APPROVE or REJECT.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate weekStart format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      throw new HttpException(
        { ok: false, message: 'Invalid weekStart format. Use YYYY-MM-DD.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Lock check
    try {
      await assertUiUnlockedOrThrow({ orderId, weekStart });
    } catch {
      throw new HttpException(
        { ok: false, message: 'Crew-week is locked and cannot be modified.' },
        HttpStatus.FORBIDDEN,
      );
    }

    // Week boundaries
    const periodStart = new Date(`${weekStart}T00:00:00.000Z`);
    const periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      throw new HttpException(
        { ok: false, message: 'Invalid weekStart date.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Target status based on action
    const targetStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const oppositeStatus = action === 'APPROVE' ? 'REJECTED' : 'APPROVED';

    // Check for conflicting state: entries in opposite finalized state
    const conflictingEntries = await this.prisma.hoursEntry.count({
      where: {
        orderId,
        type: 'OFFICIAL',
        approvalStatus: oppositeStatus,
        AND: [
          { periodEnd: { gt: periodStart } },
          { periodStart: { lt: periodEnd } },
        ],
      },
    });

    if (conflictingEntries > 0) {
      throw new HttpException(
        {
          ok: false,
          message: `Cannot ${action}. ${conflictingEntries} entry/entries already ${oppositeStatus}. Conflicting state blocked.`,
        },
        HttpStatus.CONFLICT,
      );
    }

    // EXACTLY ONE WRITE: Update all PENDING entries to target status
    // Also update entries already in target status (idempotent - no-op for those)
    const result = await this.prisma.hoursEntry.updateMany({
      where: {
        orderId,
        type: 'OFFICIAL',
        approvalStatus: { in: ['PENDING', targetStatus] },
        AND: [
          { periodEnd: { gt: periodStart } },
          { periodStart: { lt: periodEnd } },
        ],
      },
      data: {
        approvalStatus: targetStatus,
        rejectionReason: action === 'REJECT' ? (note || null) : null,
      },
    });

    return {
      ok: true,
      message: `Successfully ${action === 'APPROVE' ? 'approved' : 'rejected'} crew-week entries.`,
      updatedCount: result.count,
    };
  }
}
