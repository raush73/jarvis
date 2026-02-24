import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as express from 'express';
import { Permissions } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { CommissionsService } from './commissions.service';

@Controller('commissions')
@UseGuards(AuthGuard('jwt'))
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  // Minimal endpoint so module compiles and wiring is valid
  @Get('health')
  @Permissions(PERMISSIONS.COMMISSIONS_READ)
  health() {
    return { ok: true };
  }

  /**
   * GET /commissions/packet.csv
   * Internal CSV export for commission packet (Accounting + Mike).
   *
   * Query params:
   * - startDate: ISO date string (YYYY-MM-DD), required
   * - endDate: ISO date string (YYYY-MM-DD), required
   */
  @Get('packet.csv')
  @Permissions(PERMISSIONS.COMMISSION_EXPORT)
  async getPacketCsv(
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @Res() res: express.Response,
  ): Promise<void> {
    // Validate: both dates required
    if (!startDateStr || !endDateStr) {
      throw new BadRequestException('startDate and endDate query params are required');
    }

    // Parse dates
    const startDate = new Date(startDateStr + 'T00:00:00.000Z');
    const endDate = new Date(endDateStr + 'T23:59:59.999Z');

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('startDate and endDate must be valid ISO date strings (YYYY-MM-DD)');
    }

    // Validate: startDate <= endDate
    if (startDate > endDate) {
      throw new BadRequestException('startDate must be <= endDate');
    }

    // Validate: range <= 31 days (guardrail)
    const msPerDay = 1000 * 60 * 60 * 24;
    const rangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay);
    if (rangeDays > 31) {
      throw new BadRequestException('Date range must be <= 31 days');
    }

    // Fetch data
    const rows = await this.commissionsService.getCommissionPacketData({
      startDate,
      endDate,
    });

    // Generate CSV
    const csv = this.commissionsService.generateCsv(rows);

    // Format filename: commission-packet_YYYY-MM-DD_to_YYYY-MM-DD.csv
    const startStr = startDateStr;
    const endStr = endDateStr;
    const filename = `commission-packet_${startStr}_to_${endStr}.csv`;

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
