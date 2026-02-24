import { Controller, Get, Header, Query } from '@nestjs/common';
import * as path from 'path';
import { PrismaService } from '../../../prisma/prisma.service';
import { readHtml, injectWindowData } from '../ui-html.util';
import { assertUiUnlockedOrThrow } from '../ui-lock.util';

/**
 * UI-9: Approved Crew-Week Timesheet Snapshot
 *
 * READ-ONLY page. No database writes. No mutations.
 * Deterministic: same inputs => same output snapshot payload.
 *
 * Route: GET /ui/internal/ui9/approved-snapshot?orderId=<id>&weekStart=<YYYY-MM-DD>
 * - orderId: Order identifier
 * - weekStart: Monday of the payroll week (YYYY-MM-DD format)
 */
@Controller('ui/internal/ui9')
export class Ui9Controller {
  constructor(private readonly prisma: PrismaService) {}

  @Get('approved-snapshot')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async renderApprovedSnapshotPage(
    @Query('orderId') orderId?: string,
    @Query('weekStart') weekStart?: string,
  ): Promise<string> {
    // Lock check (env-controlled, currently NO-OP)
    try {
      await assertUiUnlockedOrThrow({ orderId: orderId!, weekStart: weekStart! });
    } catch {
      return injectWindowData('', { ok: false, errorId: 'JAR-LOCKED', reason: 'FORCE_SMOKE_TEST' });
    }

    const filePath = path.join(__dirname, '../ui9/approved-snapshot.html');
    const html = readHtml(filePath);

    // If any required param missing, return static HTML unchanged (placeholder state)
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

    // Validate dates
    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      return html;
    }

    try {
      // READ-ONLY: Fetch ALL approved official HoursEntry rows for crew-week
      // No writes, no mutations - findMany is read-only
      // Include lines relation to capture SD buckets (REG_SD, OT_SD, DT_SD)
      const entries = await this.prisma.hoursEntry.findMany({
        where: {
          orderId,
          type: 'OFFICIAL',
          approvalStatus: 'APPROVED',
          AND: [
            { periodEnd: { gt: periodStart } },
            { periodStart: { lt: periodEnd } },
          ],
        },
        select: {
          workerId: true,
          totalHours: true,
          lines: {
            select: {
              earningCode: true,
              unit: true,
              quantity: true,
              rate: true,
              amount: true,
            },
          },
        },
      });

      // DETERMINISM: Sort items by workerId for stable ordering
      // This ensures same inputs => same output regardless of DB row insertion order
      const items = entries
        .map((e) => {
          // 1:1 carry-forward of HoursEntryLine records
          const lines = e.lines.map((line) => ({
            earningCode: line.earningCode,
            unit: line.unit,
            quantity: line.quantity ? Number(line.quantity) : 0,
            rate: line.rate ? Number(line.rate) : null,
            amount: line.amount ? Number(line.amount) : null,
          }));

          // Per-worker SD buckets: 1:1 sum from HoursEntryLine.unit = REG_SD/OT_SD/DT_SD
          let regSdHours = 0;
          let otSdHours = 0;
          let dtSdHours = 0;

          for (const line of lines) {
            if (line.unit === 'REG_SD') {
              regSdHours += line.quantity;
            } else if (line.unit === 'OT_SD') {
              otSdHours += line.quantity;
            } else if (line.unit === 'DT_SD') {
              dtSdHours += line.quantity;
            }
          }

          return {
            workerLabel: e.workerId,
            totalHours: typeof e.totalHours === 'number' ? e.totalHours : 0,
            // Per-worker SD buckets (1:1 from lines where unit=REG_SD/OT_SD/DT_SD)
            regSdHours,
            otSdHours,
            dtSdHours,
            lines,
          };
        })
        .sort((a, b) => a.workerLabel.localeCompare(b.workerLabel));

      // Compute totals
      const totalWorkers = items.length;
      const totalHours = items.reduce((sum, item) => sum + item.totalHours, 0);

      // Overall SD buckets (sum of per-worker SD buckets, 1:1 mirror)
      const regSdHours = items.reduce((sum, item) => sum + item.regSdHours, 0);
      const otSdHours = items.reduce((sum, item) => sum + item.otSdHours, 0);
      const dtSdHours = items.reduce((sum, item) => sum + item.dtSdHours, 0);

      // Legacy sdBuckets object (backward compatibility)
      const sdBuckets = {
        REG_SD: regSdHours,
        OT_SD: otSdHours,
        DT_SD: dtSdHours,
      };

      // UI display: "Week Ending Sunday" = periodStart + 6 days
      const weekEndingSunday = new Date(periodStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      const periodStartDisplay = periodStart.toISOString().slice(0, 10);
      const periodEndDisplay = weekEndingSunday.toISOString().slice(0, 10);

      // Build window.__DATA__ object (deterministic payload)
      // SD buckets (regSdHours, otSdHours, dtSdHours) at both overall and per-worker levels.
      // SD values are 1:1 from HoursEntryLine.unit = REG_SD/OT_SD/DT_SD.
      const data = {
        orderId,
        periodStart: periodStartDisplay,
        periodEnd: periodEndDisplay,
        items,
        totalWorkers,
        totalHours,
        // Overall SD buckets (1:1 from lines where unit=REG_SD/OT_SD/DT_SD)
        regSdHours,
        otSdHours,
        dtSdHours,
        // Legacy sdBuckets object (backward compatibility)
        sdBuckets,
      };

      return injectWindowData(html, data);
    } catch {
      // On error, return static HTML unchanged (placeholder state)
      return html;
    }
  }
}
