import { Body, Controller, Get, Param, Post, BadRequestException } from '@nestjs/common';
import { PayrollRunService } from './payroll-run.service';
import { PayrollService } from '../payroll/payroll.service';

@Controller('payroll-run')
export class PayrollRunController {
  constructor(
    private readonly payrollRunService: PayrollRunService,
    private readonly payrollService: PayrollService,
  ) {}

  @Get(':id')
  async getById(@Param('id') id: string) {
    const run = await this.payrollRunService.getPayrollRunById(id);
    if (!run) {
      return { ok: false, error: 'PAYROLL_RUN_NOT_FOUND' };
    }
    return { ok: true, run };
  }

  @Post('finalize')
  async finalize(@Body() body: any) {
    const { weekEnd, includeReference = false, includeDeductions = false } = body ?? {};

    if (!weekEnd || typeof weekEnd !== 'string') {
      throw new BadRequestException('weekEnd is required (YYYY-MM-DD)');
    }

    const rollup = await this.payrollService.getWeeklyRollup({
      weekEnd,
      includeReference: Boolean(includeReference),
    });

    const employeeIds = Array.from(
      new Set(
        (rollup.groups ?? [])
          .map((g: any) => g.workerId)
          .filter(Boolean),
      ),
    );

    let deductionElections: any = [];
    let deductionsPreview: any = null;

    if (includeDeductions) {
      deductionElections =
        employeeIds.length > 0
          ? await this.payrollService.getWeeklyDeductionElectionsPreview({
              weekStartIso: rollup.weekStart,
              employeeIds,
            })
          : [];

      deductionsPreview = this.payrollService.calculateWeeklyDeductionsPreview({
        elections: deductionElections,
      });
    }

    const snapshotJson = {
      rollup,
      ...(includeDeductions
        ? {
            deductionElections,
            deductionsPreview,
          }
        : {}),
    };

    const payrollRun = await this.payrollRunService.createPayrollRun({
      weekStart: new Date(rollup.weekStart),
      weekEnd: new Date(rollup.weekEnd),
      timezone: 'America/Chicago',
      snapshotJson,
      includeDeductions: Boolean(includeDeductions),
      includeReference: Boolean(includeReference),
      finalizedByUserId: null,
    });

    return { ok: true, payrollRunId: payrollRun.id };
  }
}
