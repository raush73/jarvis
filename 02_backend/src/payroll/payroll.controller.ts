import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PayrollService } from './payroll.service';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  /**
   * Read-only weekly rollup of hours lines.
   * Week rule: Sunday–Saturday Chicago-week containing periodEnd (consistent with invoicing).
   *
   * Query:
   * - weekEnd: YYYY-MM-DD (interpreted as Chicago local date; used to anchor the week)
   * - includeReference: 'true' to include reference hours (default false)
   */
  @Get('weekly-rollup')
  weeklyRollup(
    @Query('weekEnd') weekEnd: string,
    @Query('includeReference') includeReference?: string,
  ) {
    return this.payrollService.getWeeklyRollup({
      weekEnd,
      includeReference: includeReference === 'true',
    });
  }

  /**
   * Read-only CSV export of the weekly payroll rollup.
   * No payroll math, no deductions, no money movement.
   */
  @Get('weekly-rollup/export')
  async weeklyRollupExport(
    @Query('weekEnd') weekEnd: string,
    @Query('includeReference') includeReference: string,
    @Res() res: Response,
  ) {
    const includeRef = includeReference === 'true';

    const data = await this.payrollService.getWeeklyRollup({
      weekEnd,
      includeReference: includeRef,
    });

    const rows = Array.isArray((data as any)?.rows)
      ? (data as any).rows
      : Array.isArray(data)
      ? data
      : [];

    const weekStart = (data as any)?.weekStart ?? '';
    const weekEndOut = (data as any)?.weekEnd ?? weekEnd;

    const header = [
      'weekStart',
      'weekEnd',
      'workerId',
      'workerName',
      'customerId',
      'customerName',
      'jobOrderId',
      'costCode',
      'unit',
      'hoursOfficial',
      'hoursReference',
    ];

    const escapeCsv = (value: any) => {
      if (value === null || value === undefined) return '';
      const s = String(value);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines: string[] = [];
    lines.push(header.join(','));

    for (const r of rows) {
      const line = [
        weekStart,
        weekEndOut,
        r.workerId ?? r.employeeId ?? '',
        r.workerName ?? r.employeeName ?? '',
        r.customerId ?? '',
        r.customerName ?? '',
        r.jobOrderId ?? r.orderId ?? '',
        r.costCode ?? r.payCode ?? '',
        r.unit ?? 'HOURS',
        r.hoursOfficial ?? r.officialHours ?? r.hours ?? '',
        includeRef ? (r.hoursReference ?? r.referenceHours ?? '') : '',
      ].map(escapeCsv);

      lines.push(line.join(','));
    }

    const csv = lines.join('\n');
    const safeWeekEnd = (weekEndOut || weekEnd || 'week').replace(/[^0-9-]/g, '');
    const filename = `payroll_weekly_rollup_${safeWeekEnd}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  }
    /**
   * Read-only JSON preview of the weekly payroll rollup.
   * Intended for UI and downstream payroll processing.
   */
    @Get('weekly-rollup/preview')
    async weeklyRollupPreview(
      @Query('weekEnd') weekEnd: string,
      @Query('includeReference') includeReference: string,
      @Query('includeDeductions') includeDeductions?: string,
    ) {
      const includeRef = includeReference === 'true';
      const includeDed = includeDeductions === 'true';
  
      const data = await this.payrollService.getWeeklyRollup({
        weekEnd,
        includeReference: includeRef,
      });
  
      const rows = Array.isArray((data as any)?.rows)
        ? (data as any).rows
        : Array.isArray(data)
        ? data
        : [];
  
      const weekStart = (data as any)?.weekStart ?? null;
      const weekEndOut = (data as any)?.weekEnd ?? weekEnd;

      // Phase 33.2 (preview-only): include deduction elections only when explicitly requested
      const employeeIds = Array.from(
        new Set(rows.map((r: any) => r.workerId ?? r.employeeId).filter(Boolean)),
      ) as string[];

      const deductionElections = includeDed
        ? await this.payrollService.getWeeklyDeductionElectionsPreview({
            weekStartIso: String(weekStart),
            employeeIds,
          })
        : null;

      // Phase 35 (preview-only): calculate deterministic deduction amounts when explicitly requested
      const deductionsPreview = includeDed
        ? this.payrollService.calculateWeeklyDeductionsPreview({
            elections: deductionElections ?? [],
          })
        : null;

  
      const totals = rows.reduce(
        (acc: any, r: any) => {
          acc.hoursOfficial += Number(
            r.hoursOfficial ?? r.officialHours ?? r.hours ?? 0,
          );
          if (includeRef) {
            acc.hoursReference += Number(
              r.hoursReference ?? r.referenceHours ?? 0,
            );
          }
          return acc;
        },
        { hoursOfficial: 0, hoursReference: 0 },
      );      return {
        weekStart,
        weekEnd: weekEndOut,
        includeReference: includeRef,
        totals,
        rows,
        ...(includeDed
          ? {
              deductionElections,
              deductionsPreview,
              deductionTotals: deductionsPreview?.totals ?? { deductionsCents: 0 },
            }
          : {}),
      };
    }
 
}


