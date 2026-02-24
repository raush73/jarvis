import { Controller, Get, Param, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PERMISSIONS } from '../auth/permissions.constants';
import { CommissionsReportService } from './commissions-report.service';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('commissions-report')
export class CommissionsReportController {
  constructor(private readonly commissionsReportService: CommissionsReportService) {}

  @Permissions(PERMISSIONS.COMMISSION_EXPORT)
  @Get(':reportRunId/export')
  async exportCsv(@Param('reportRunId') reportRunId: string, @Res() res: Response) {
    const buf = await this.commissionsReportService.exportCsv(reportRunId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="commission-report-' + reportRunId + '.csv"');
    return res.send(buf);
  }
}
