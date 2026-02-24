import { Controller, Get, Post, Body, Header, Query, HttpException, HttpStatus } from '@nestjs/common';
import * as path from 'path';
import { PrismaService } from '../../../prisma/prisma.service';
import { readHtml, injectWindowData } from '../ui-html.util';
import { assertUiUnlockedOrThrow } from '../ui-lock.util';
import { Roles } from '../../../auth/authz/authz.decorators';

/**
 * UI-14: Crew-Week Timesheet Draft Entry
 *
 * Draft entry surface for OFFICIAL PENDING HoursEntry rows.
 * Does NOT approve, lock, calculate bonuses, or affect invoices.
 *
 * Route: GET  /ui/internal/ui14/timesheet-draft?orderId=<id>&weekStart=<YYYY-MM-DD>
 * Route: POST /ui/internal/ui14/timesheet-draft (body: { orderId, weekStart, items })
 */
@Controller('ui/internal/ui14')
export class Ui14Controller {
  constructor(private readonly prisma: PrismaService) {}

  @Get('timesheet-draft')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Roles('admin')
  async renderTimesheetDraftPage(
    @Query('orderId') orderId?: string,
    @Query('weekStart') weekStart?: string,
  ): Promise<string> {

    const filePath = path.join(__dirname, '../templates/ui14-timesheet-draft.html');
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
    const periodEndExclusive = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (isNaN(periodStart.getTime()) || isNaN(periodEndExclusive.getTime())) {
      return html;
    }

    // Lock check (only after params/date validated)
    try {
      await assertUiUnlockedOrThrow({ orderId, weekStart });
    } catch {
      return injectWindowData(html, { ok: false, errorId: 'JAR-LOCKED', reason: 'CREW_WEEK_LOCKED' });
    }

    // periodEnd for display = weekStart + 6 days (Sunday)
    const periodEnd = new Date(periodStart.getTime() + 6 * 24 * 60 * 60 * 1000);

    try {
      // Fetch existing OFFICIAL PENDING HoursEntry rows for this orderId + crew-week
      const entries = await this.prisma.hoursEntry.findMany({
        where: {
          orderId,
          type: 'OFFICIAL',
          approvalStatus: 'PENDING',
          AND: [
            { periodEnd: { gt: periodStart } },
            { periodStart: { lt: periodEndExclusive } },
          ],
        },
        select: {
          workerId: true,
          totalHours: true,
        },
      });

      // Build items array sorted by workerId for determinism
      const items = entries
        .map((e) => ({
          workerId: e.workerId,
          totalHours: typeof e.totalHours === 'number' ? e.totalHours : 0,
        }))
        .sort((a, b) => a.workerId.localeCompare(b.workerId));

      const periodStartDisplay = periodStart.toISOString().slice(0, 10);
      const periodEndDisplay = periodEnd.toISOString().slice(0, 10);

      const data = {
        orderId,
        weekStart,
        periodStart: periodStartDisplay,
        periodEnd: periodEndDisplay,
        items,
      };

      return injectWindowData(html, data);
    } catch {
      return html;
    }
  }

  @Post('timesheet-draft')
  @Header('Content-Type', 'application/json')
  @Roles('admin')
  async submitTimesheetDraft(
    @Body() body: {
      orderId?: string;
      weekStart?: string;
      items?: Array<{ workerId?: string; totalHours?: number }>;
    },
  ): Promise<{ ok: boolean; message?: string }> {
    const { orderId, weekStart, items } = body;

    // Validate required params
    if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
      throw new HttpException(
        { ok: false, message: 'Missing or invalid orderId' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!weekStart || typeof weekStart !== 'string') {
      throw new HttpException(
        { ok: false, message: 'Missing or invalid weekStart' },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate weekStart format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      throw new HttpException(
        { ok: false, message: 'Invalid weekStart format. Use YYYY-MM-DD.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!Array.isArray(items)) {
      throw new HttpException(
        { ok: false, message: 'Missing or invalid items array' },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.workerId || typeof item.workerId !== 'string' || item.workerId.trim() === '') {
        throw new HttpException(
          { ok: false, message: `Item ${i}: missing or invalid workerId` },
          HttpStatus.BAD_REQUEST,
        );
      }
      if (typeof item.totalHours !== 'number' || item.totalHours < 0) {
        throw new HttpException(
          { ok: false, message: `Item ${i}: totalHours must be a non-negative number` },
          HttpStatus.BAD_REQUEST,
        );
      }
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
    const periodEndExclusive = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (isNaN(periodStart.getTime()) || isNaN(periodEndExclusive.getTime())) {
      throw new HttpException(
        { ok: false, message: 'Invalid weekStart date.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    // periodEnd stored = weekStart + 6 days (Sunday) for the entry
    const periodEndStored = new Date(periodStart.getTime() + 6 * 24 * 60 * 60 * 1000);

    // Check if any OFFICIAL APPROVED entry exists for this crew-week
    const approvedCount = await this.prisma.hoursEntry.count({
      where: {
        orderId,
        type: 'OFFICIAL',
        approvalStatus: 'APPROVED',
        AND: [
          { periodEnd: { gt: periodStart } },
          { periodStart: { lt: periodEndExclusive } },
        ],
      },
    });

    if (approvedCount > 0) {
      throw new HttpException(
        { ok: false, message: 'Crew-week is locked: APPROVED entries exist. Cannot modify.' },
        HttpStatus.CONFLICT,
      );
    }

    // Build set of workerIds from input
    const inputWorkerIds = new Set(items.map((item) => item.workerId!.trim()));

    // Delete OFFICIAL PENDING entries for this crew-week NOT in the provided workerId list
    await this.prisma.hoursEntry.deleteMany({
      where: {
        orderId,
        type: 'OFFICIAL',
        approvalStatus: 'PENDING',
        workerId: { notIn: Array.from(inputWorkerIds) },
        AND: [
          { periodEnd: { gt: periodStart } },
          { periodStart: { lt: periodEndExclusive } },
        ],
      },
    });

    // Upsert entries for each provided workerId
    for (const item of items) {
      const workerId = item.workerId!.trim();
      const totalHours = item.totalHours!;

      // Find existing OFFICIAL PENDING entry for this worker in crew-week
      const existing = await this.prisma.hoursEntry.findFirst({
        where: {
          orderId,
          workerId,
          type: 'OFFICIAL',
          approvalStatus: 'PENDING',
          AND: [
            { periodEnd: { gt: periodStart } },
            { periodStart: { lt: periodEndExclusive } },
          ],
        },
        select: { id: true },
      });

      if (existing) {
        // Update existing
        await this.prisma.hoursEntry.update({
          where: { id: existing.id },
          data: {
            totalHours,
            enteredBy: 'MW4H',
          },
        });
      } else {
        // Create new
        await this.prisma.hoursEntry.create({
          data: {
            orderId,
            workerId,
            totalHours,
            periodStart,
            periodEnd: periodEndStored,
            type: 'OFFICIAL',
            approvalStatus: 'PENDING',
            enteredBy: 'MW4H',
          },
        });
      }
    }

    return { ok: true };
  }
}
