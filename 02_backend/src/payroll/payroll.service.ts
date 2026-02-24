import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceCutoffService } from '../invoices/invoice-cutoff.service';
import { HoursEntryUnit, PayrollEarningCode } from '@prisma/client';

type WeeklyRollupParams = {
  weekEnd: string; // YYYY-MM-DD (Chicago local date)
  includeReference: boolean;
};

type RollupLine = {
  earningCode: PayrollEarningCode;
  unit: HoursEntryUnit;
  quantity: number;
};

type RollupGroup = {
  workerId: string;
  orderId: string;  
  periodStart: string;
  periodEnd: string;
  totals: RollupLine[];
};

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceCutoff: InvoiceCutoffService,
  ) {}

  /**
   * Deterministic week boundaries:
   * Use InvoiceCutoffService's "same week" definition: Sunday–Saturday Chicago-week containing periodEnd.
   * We anchor by taking weekEnd (Chicago local date) -> UTC instant at Chicago noon (safe) -> compute Sunday.
   */
  async getWeeklyRollup(params: WeeklyRollupParams): Promise<{
    weekStart: string;
    weekEnd: string;
    includeReference: boolean;
    groups: RollupGroup[];
  }> {
    const weekEndDate = this.parseChicagoLocalDate(params.weekEnd);
    // Use noon Chicago to avoid DST edge at midnight
    const weekEndNoonUtc = this.chicagoLocalNoonToUtc(weekEndDate);

    // Reuse the existing Sunday calculation logic by treating "periodEnd" as the anchor.
    // We compute the Sunday of that week in Chicago, then set end as Saturday (6 days later).
    const sundayUtc = this.getSundayUtcForChicagoWeekContaining(weekEndNoonUtc);
    const saturdayUtc = new Date(sundayUtc.getTime() + 6 * 24 * 60 * 60 * 1000);

    const types = params.includeReference ? (['OFFICIAL', 'REFERENCE'] as const) : (['OFFICIAL'] as const);

    const entries = await this.prisma.hoursEntry.findMany({
      where: {
        type: { in: types as any },
        periodEnd: {
          gte: sundayUtc,
          lte: saturdayUtc,
        },
      },
      include: {
        lines: true,
      },
      orderBy: [{ workerId: 'asc' }, { orderId: 'asc' }],
    });

    // Group by workerId+orderId+periodStart+periodEnd
    const map = new Map<string, { workerId: string; orderId: string; periodStart: Date; periodEnd: Date; totals: Map<string, number> }>();

    for (const e of entries) {
      const key = `${e.workerId}__${e.orderId}__${e.periodStart.toISOString()}__${e.periodEnd.toISOString()}`;
      if (!map.has(key)) {
        map.set(key, {
          workerId: e.workerId,
          orderId: e.orderId,
          periodStart: e.periodStart,
          periodEnd: e.periodEnd,
          totals: new Map<string, number>(),
        });
      }
      const g = map.get(key)!;

      // Prefer lines if present; otherwise fall back to totalHours as REG/HOURS (back-compat).
      if (e.lines && e.lines.length > 0) {
        for (const l of e.lines) {
          const k = `${l.earningCode}__${l.unit}`;
          g.totals.set(k, (g.totals.get(k) ?? 0) + Number(l.quantity));
        }
      } else if (typeof e.totalHours === 'number') {
        const k = `${PayrollEarningCode.REG}__${HoursEntryUnit.HOURS}`;
        g.totals.set(k, (g.totals.get(k) ?? 0) + Number(e.totalHours));
      }
    }

    const groups: RollupGroup[] = Array.from(map.values()).map((g) => ({
      workerId: g.workerId,
      orderId: g.orderId,
      periodStart: g.periodStart.toISOString(),
      periodEnd: g.periodEnd.toISOString(),
      totals: Array.from(g.totals.entries()).map(([k, qty]) => {
        const [earningCode, unit] = k.split('__');
        return {
          earningCode: earningCode as PayrollEarningCode,
          unit: unit as HoursEntryUnit,
          quantity: qty,
        };
      }),
    }));

    return {
      weekStart: sundayUtc.toISOString(),
      weekEnd: saturdayUtc.toISOString(),
      includeReference: params.includeReference,
      groups,
    };
  }
  /**
   * Preview-only: resolve the latest active deduction election per (employeeId, code)
   * that is effective for the given payroll weekStart.
   *
   * Rules (Phase 33 locked):
   * - OFF unless explicitly requested by controller
   * - Effective dating: applies next payroll week only (we treat effectiveWeek as weekStart anchor)
   * - Read-only: no math, no execution, no exports
   */
  async getWeeklyDeductionElectionsPreview(params: {
    weekStartIso: string; // ISO string from getWeeklyRollup().weekStart
    employeeIds: string[];
  }): Promise<
    Array<{
      employeeId: string;
      code: string;
      amountCents: number | null;
      percentBasis: number | null;
      effectiveWeek: string;
    }>
  > {
    const { weekStartIso, employeeIds } = params;

    if (!employeeIds || employeeIds.length === 0) return [];

    const weekStart = new Date(weekStartIso);

    const rows = await this.prisma.payrollDeductionElection.findMany({
      where: {
        employeeId: { in: employeeIds },
        isActive: true,
        effectiveWeek: { lte: weekStart },
      },
      orderBy: [{ effectiveWeek: 'desc' }, { createdAt: 'desc' }],
      select: {
        employeeId: true,
        code: true,
        amountCents: true,
        percentBasis: true,
        effectiveWeek: true,
      },
    });

    // Keep only the latest per (employeeId, code)
    const seen = new Set<string>();
    const out: Array<{
      employeeId: string;
      code: string;
      amountCents: number | null;
      percentBasis: number | null;
      effectiveWeek: string;
    }> = [];

    for (const r of rows) {
      const key = `${r.employeeId}__${r.code}`;
      if (seen.has(key)) continue;
      seen.add(key);

      out.push({
        employeeId: r.employeeId,
        code: r.code,
        amountCents: r.amountCents ?? null,
        percentBasis: r.percentBasis ?? null,
        effectiveWeek: r.effectiveWeek.toISOString(),
      });
    }

    return out;
  }

  /**
   * Phase 35 (preview-only): calculate deterministic deduction amounts from deduction elections.
   *
   * Guardrails:
   * - Preview only (no execution, no posting)
   * - Does NOT require/pay attention to bank data
   * - Currently supports FIXED amount deductions (amountCents).
   * - Percent-based deductions are returned with amountCents=0 and a warning, since we do not have wage bases in Phase 35.
   */
  calculateWeeklyDeductionsPreview(params: {
    elections: Array<{
      employeeId: string;
      code: string;
      amountCents: number | null;
      percentBasis: number | null;
      effectiveWeek: string;
    }>;
  }): {
    byEmployee: Array<{
      employeeId: string;
      deductions: Array<{
        code: string;
        label: string;
        method: 'FIXED_AMOUNT' | 'PERCENT';
        amountCents: number;
        currency: 'USD';
        warning?: string | null;
      }>;
      totals: {
        deductionsCents: number;
      };
    }>;
    totals: {
      deductionsCents: number;
    };
  } {
    const elections = Array.isArray(params?.elections) ? params.elections : [];

    const labelFor = (code: string): string => {
      if (code === 'ETV') return 'Empower The Veterans Foundation';
      return code;
    };

    // Group elections by employeeId
    const map = new Map<string, typeof elections>();
    for (const e of elections) {
      if (!e?.employeeId || !e?.code) continue;
      if (!map.has(e.employeeId)) map.set(e.employeeId, []);
      map.get(e.employeeId)!.push(e);
    }

    const byEmployee: Array<{
      employeeId: string;
      deductions: Array<{
        code: string;
        label: string;
        method: 'FIXED_AMOUNT' | 'PERCENT';
        amountCents: number;
        currency: 'USD';
        warning?: string | null;
      }>;
      totals: { deductionsCents: number };
    }> = [];

    let grandTotal = 0;

    for (const [employeeId, list] of map.entries()) {
      // Deterministic ordering (stable output)
      const ordered = [...list].sort((a, b) => (a.code || '').localeCompare(b.code || ''));

      const deductions: Array<{
        code: string;
        label: string;
        method: 'FIXED_AMOUNT' | 'PERCENT';
        amountCents: number;
        currency: 'USD';
        warning?: string | null;
      }> = [];

      let empTotal = 0;

      for (const e of ordered) {
        if (typeof e.amountCents === 'number' && Number.isFinite(e.amountCents)) {
          const amt = Math.trunc(e.amountCents);
          deductions.push({
            code: e.code,
            label: labelFor(e.code),
            method: 'FIXED_AMOUNT',
            amountCents: amt,
            currency: 'USD',
          });
          empTotal += amt;
          continue;
        }

        if (typeof e.percentBasis === 'number' && Number.isFinite(e.percentBasis)) {
          // Phase 35 does not have a wage base yet. Return deterministic placeholder with warning.
          deductions.push({
            code: e.code,
            label: labelFor(e.code),
            method: 'PERCENT',
            amountCents: 0,
            currency: 'USD',
            warning: 'PERCENT_BASIS_NOT_CALCULATED_IN_PHASE_35',
          });
          continue;
        }
      }

      grandTotal += empTotal;

      byEmployee.push({
        employeeId,
        deductions,
        totals: { deductionsCents: empTotal },
      });
    }

    // Deterministic ordering by employeeId
    byEmployee.sort((a, b) => a.employeeId.localeCompare(b.employeeId));

    return {
      byEmployee,
      totals: { deductionsCents: grandTotal },
    };
  }


  private parseChicagoLocalDate(input: string): { year: number; month: number; day: number } {
        // Expect YYYY-MM-DD
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
    if (!m) throw new BadRequestException('weekEnd must be in YYYY-MM-DD format');
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const day = parseInt(m[3], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) throw new BadRequestException('weekEnd is invalid');
    return { year, month, day };
  }

  private chicagoLocalNoonToUtc(d: { year: number; month: number; day: number }): Date {
    // Create a Date that represents 12:00 Chicago local time for the given date, as a UTC instant.
    // We do this by formatting that local time into parts, then converting using InvoiceCutoffService's converter.
    // Reuse chicagoPartsToUtcDate indirectly by calling getCutoffForInvoicePeriod with a synthetic Date at noon UTC
    // is messy; so we do a simpler deterministic approach:
    // - Start with UTC noon same Y/M/D
    // - It is close enough for week-of-day calculation because we only need the weekday in Chicago, not exact instant.
    return new Date(Date.UTC(d.year, d.month - 1, d.day, 12, 0, 0));
  }

  private getSundayUtcForChicagoWeekContaining(anchorUtc: Date): Date {
    // Reuse the same day-of-week mapping logic by calling InvoiceCutoffService private methods is not possible.
    // So we replicate the same approach here with Intl.DateTimeFormat in America/Chicago (same as InvoiceCutoffService).
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

    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dayOfWeek = dayMap[weekday] ?? 0;

    // Get Chicago-local Y/M/D from anchorUtc
    const year = parseInt(partsMap.get('year') || '0', 10);
    const month = parseInt(partsMap.get('month') || '0', 10);
    const day = parseInt(partsMap.get('day') || '0', 10);

    // Subtract to Sunday in Chicago-local calendar, then represent as UTC noon for safety.
    const sundayLocal = new Date(Date.UTC(year, month - 1, day - dayOfWeek, 12, 0, 0));
    return sundayLocal;
  }
}

