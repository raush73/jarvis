import { BadRequestException, Body, Controller, Get, Header, Post, Query } from '@nestjs/common';
import * as path from 'path';
import { PrismaService } from '../../../prisma/prisma.service';
import { readHtml, injectWindowData } from '../ui-html.util';
import { assertUiUnlockedOrThrow, UiLockedError, UI_LOCK_ERROR_CODE } from '../ui-lock.util';

@Controller('ui/internal/ui7')
export class Ui7Controller {
  constructor(private readonly prisma: PrismaService) {}

  @Get('review-promotion')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async renderReviewPromotionPage(
    @Query('orderId') orderId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('weekStart') weekStart?: string,
  ): Promise<string> {
    const filePath = path.join(__dirname, '../ui7/review-promotion.html');
    const html = readHtml(filePath);

    // If any param missing, return static HTML unchanged
    if (!orderId || !employeeId || !weekStart) {
      return html;
    }

    try {
      // Compute MW4H payroll week boundaries (Monday -> next Monday exclusive)
      const weekBounds = this.computeChicagoWeekBounds(weekStart);
      if (!weekBounds) {
        return html;
      }

      try {
      await assertUiUnlockedOrThrow({ orderId, weekStart });
    } catch (e: any) {
      if (e instanceof UiLockedError) {
        throw new BadRequestException({ ok: false, errorId: UI_LOCK_ERROR_CODE, reason: e.reason });
      }
      throw e;
    }

      const { weekStartUtc, weekEndUtc, weekStartDisplay, weekEndDisplay } = weekBounds;

      // Build LEFT: 7-day array (Sun-Sat) from employeeHoursSelfReport
      const leftData = await this.fetchLeftData(employeeId, orderId, weekStartUtc, weekEndUtc);
      const leftTotalHours = leftData.totalHours;

      // Compute RIGHT: official week total
      const officialWeekTotalHours = await this.fetchRightData(
        employeeId,
        orderId,
        weekStartUtc,
        weekEndUtc,
      );

      // Calculate weekly delta
      const weeklyDelta = leftTotalHours - officialWeekTotalHours;
      const isDifferentWeek = Math.abs(weeklyDelta) >= 0.01;

      // Inject data via script tag
      const data = {
        orderId,
        employeeId,
        weekStart: weekStartDisplay,
        weekEnd: weekEndDisplay,
        timezone: 'America/Chicago',
        leftData: leftData.days,
        leftTotalHours,
        officialWeekTotalHours,
        weeklyDelta,
        isDifferentWeek,
      };

      return injectWindowData(html, data);
    } catch (error) {
      // On error, return static HTML unchanged
      return html;
    }

    return html;
  }

  @Post('review-promotion/promote')
  async promoteReferenceToOfficial(
    @Body() body: { orderId: string; employeeId?: string; workerId?: string; weekStart: string },
  ): Promise<{ ok: true; hoursEntryId: string }> {
    const orderId = body?.orderId;
    const workerId = body?.workerId ?? body?.employeeId;
    const weekStart = body?.weekStart;

    if (!orderId || !workerId || !weekStart) {
      throw new BadRequestException("Missing orderId, workerId, or weekStart");
    }

    // Validate weekStart format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      throw new BadRequestException('weekStart must be a Monday (YYYY-MM-DD)');
    }

    // Validate weekStart is a Monday
    const periodStart = new Date(`${weekStart}T00:00:00.000Z`);
    if (periodStart.getUTCDay() !== 1) {
      throw new BadRequestException('weekStart must be a Monday (YYYY-MM-DD)');
    }

    // MW4H payroll week: Monday 00:00Z to next Monday 00:00Z (exclusive)
    const periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    try {
      await assertUiUnlockedOrThrow({ orderId, weekStart });
    } catch (e: any) {
      if (e instanceof UiLockedError) {
        throw new BadRequestException({ ok: false, errorId: UI_LOCK_ERROR_CODE, reason: e.reason });
      }
      throw e;
    }
    // Enforce hours lock (invoice exists => locked)
    const invoice = await this.prisma.invoice.findFirst({
      where: { orderId },
      select: { id: true },
    });
    if (invoice) {
      throw new BadRequestException('Hours are locked because invoice exists for this order.');
    }

    // Prevent duplicate promote for same worker-week
    const existing = await this.prisma.hoursEntry.findFirst({
      where: {
        orderId,
        workerId: workerId,
        type: 'OFFICIAL',
        periodStart: periodStart,
        periodEnd: periodEnd,
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      return { ok: true, hoursEntryId: existing.id };
    }

    // IMPORTANT: Self-reported hours are REFERENCE ONLY and must NEVER become OFFICIAL/invoiceable.
    // Promote creates an OFFICIAL (customer-approval) shell only.
    const totalHours = 0;

    const created = await this.prisma.hoursEntry.create({
      data: {
        type: 'OFFICIAL',
        enteredBy: 'MW4H',
        orderId,
        workerId: workerId,
        periodStart: periodStart,
        periodEnd: periodEnd,
        isOfficial: true,
        approvalStatus: 'PENDING',
        totalHours,
      },
      select: { id: true },
    });

    return { ok: true, hoursEntryId: created.id };
  }
  private computeChicagoWeekBounds(
    weekStartInput: string,
  ): {
    weekStartUtc: Date;
    weekEndUtc: Date;
    weekStartDisplay: string;
    weekEndDisplay: string;
  } | null {
    try {
      // Parse input (YYYY-MM-DD or ISO)
      let anchorDate: Date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(weekStartInput)) {
        const [year, month, day] = weekStartInput.split('-').map(Number);
        // Use Chicago noon to avoid DST issues
        anchorDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      } else {
        const iso = new Date(weekStartInput);
        if (isNaN(iso.getTime())) {
          return null;
        }

        // Interpret ISO instant as Chicago local date, anchor at Chicago noon (DST-safe)
        const fmt = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Chicago',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        const parts = fmt.formatToParts(iso);
        const map = new Map(parts.map((p) => [p.type, p.value]));

        const y = Number(map.get('year'));
        const m = Number(map.get('month'));
        const d = Number(map.get('day'));

        anchorDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      }

      // Get Sunday of the week containing anchorDate (in Chicago timezone)
      const sundayUtc = this.getSundayUtcForChicagoWeekContaining(anchorDate);
      const saturdayUtc = new Date(sundayUtc.getTime() + 6 * 24 * 60 * 60 * 1000);

      // Format display strings (YYYY-MM-DD) in Chicago timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      const sundayParts = formatter.formatToParts(sundayUtc);
      const saturdayParts = formatter.formatToParts(saturdayUtc);
      const partsMapSunday = new Map(sundayParts.map((p) => [p.type, p.value]));
      const partsMapSaturday = new Map(saturdayParts.map((p) => [p.type, p.value]));

      const weekStartDisplay = `${partsMapSunday.get('year')}-${partsMapSunday.get('month')}-${partsMapSunday.get('day')}`;
      const weekEndDisplay = `${partsMapSaturday.get('year')}-${partsMapSaturday.get('month')}-${partsMapSaturday.get('day')}`;

      return {
        weekStartUtc: sundayUtc,
        weekEndUtc: saturdayUtc,
        weekStartDisplay,
        weekEndDisplay,
      };
    } catch {
      return null;
    }
  }

  private getSundayUtcForChicagoWeekContaining(anchorUtc: Date): Date {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(anchorUtc);
    const partsMap = new Map(parts.map((p) => [p.type, p.value]));
    const weekday = partsMap.get('weekday') || 'Sun';

    const dayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const dayOfWeek = dayMap[weekday] ?? 0;

    const year = parseInt(partsMap.get('year') || '0', 10);
    const month = parseInt(partsMap.get('month') || '0', 10);
    const day = parseInt(partsMap.get('day') || '0', 10);

    // Subtract to Sunday in Chicago-local calendar, then represent as UTC noon for safety
    const sundayLocal = new Date(Date.UTC(year, month - 1, day - dayOfWeek, 12, 0, 0));
    return sundayLocal;
  }

  private async fetchLeftData(
    employeeId: string,
    orderId: string,
    weekStartUtc: Date,
    weekEndUtc: Date,
  ): Promise<{
    days: Array<{ date: string; hours: number }>;
    totalHours: number;
  }> {
    // Query self-reported hours for the week
    const reports = await this.prisma.employeeHoursSelfReport.findMany({
      where: {
        employeeId,
        orderId,
        workDate: {
          gte: weekStartUtc,
          lt: weekEndUtc,
        },
      },
      select: {
        workDate: true,
        totalMinutes: true,
      },
    });

    // Build 7-day array (Sun-Sat)
    const daysMap = new Map<string, number>();
    for (const report of reports) {
      if (report.totalMinutes !== null) {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Chicago',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        const parts = formatter.formatToParts(report.workDate);
        const partsMap = new Map(parts.map((p) => [p.type, p.value]));
        const dateStr = `${partsMap.get('year')}-${partsMap.get('month')}-${partsMap.get('day')}`;
        const hours = report.totalMinutes / 60;
        daysMap.set(dateStr, hours);
      }
    }

    // Generate all 7 days (Sun-Sat)
    const days: Array<{ date: string; hours: number }> = [];
    let totalHours = 0;
    const currentDate = new Date(weekStartUtc);

    for (let i = 0; i < 7; i++) {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
      });
      const parts = formatter.formatToParts(currentDate);
      const partsMap = new Map(parts.map((p) => [p.type, p.value]));
      const dateStr = `${partsMap.get('year')}-${partsMap.get('month')}-${partsMap.get('day')}`;
      const hours = daysMap.get(dateStr) ?? 0;
      totalHours += hours;

      days.push({
        date: dateStr,
        hours,
      });

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return { days, totalHours };
  }

  private async fetchRightData(
    employeeId: string,
    orderId: string,
    weekStartUtc: Date,
    weekEndUtc: Date,
  ): Promise<number> {
    // Query official hours entries that intersect the MW4H payroll week (Mon -> next Mon exclusive)
    const entries = await this.prisma.hoursEntry.findMany({
      where: {
        type: 'OFFICIAL',
        workerId: employeeId,
        orderId: orderId,
        // Period intersects the week (weekEnd is EXCLUSIVE) if:
        // periodEnd > weekStart AND periodStart < weekEnd
        periodEnd: {
          gt: weekStartUtc,
        },
        periodStart: {
          lt: weekEndUtc,
        },
      },
      include: {
        lines: true,
      },
    });

    let totalHours = 0;

    for (const entry of entries) {
      // Prefer totalHours if present
      if (typeof entry.totalHours === 'number' && Number.isFinite(entry.totalHours)) {
        totalHours += entry.totalHours;
      } else if (entry.lines && entry.lines.length > 0) {
        // Otherwise sum related HoursEntryLine.quantity WHERE unit == 'HOURS'
        for (const line of entry.lines) {
          if (line.unit === 'HOURS') {
            totalHours += Number(line.quantity);
          }
        }
      }
    }

    return totalHours;
  }
}

















