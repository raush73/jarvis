import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { PacketService } from './packet.service';

/**
 * Payroll Packet v1 Controller
 *
 * Internal endpoints for payroll packet generation and CSV export.
 * All endpoints require internal admin authentication.
 *
 * ENDPOINT (REQUIRED):
 * GET /payroll/packet/v1/export?weekStart=YYYY-MM-DD
 * - Returns CSV download
 * - Deterministic row ordering: EmployeeName asc, then LOC asc
 */
@Controller('payroll/packet')
export class PacketController {
  constructor(private readonly packetService: PacketService) {}

  /**
   * GET /payroll/packet/v1/export?weekStart=YYYY-MM-DD
   *
   * Generate and export payroll packet as CSV.
   * Does NOT persist to database (use /generate for persistence).
   *
   * Query Parameters:
   * - weekStart: Monday date in YYYY-MM-DD format (required)
   *
   * Response:
   * - Content-Type: text/csv
   * - Content-Disposition: attachment; filename="payroll_packet_v1_YYYY-MM-DD.csv"
   */
  @Get('v1/export')
  async exportCsv(
    @Query('weekStart') weekStart: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!weekStart) {
      throw new BadRequestException('weekStart query parameter is required');
    }

    const result = await this.packetService.generatePacketRows(weekStart);
    const csv = this.packetService.generateCsv(result.rows);

    const safeWeekStart = weekStart.replace(/[^0-9-]/g, '');
    const filename = `payroll_packet_v1_${safeWeekStart}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  }

  /**
   * GET /payroll/packet/v1/preview?weekStart=YYYY-MM-DD
   *
   * Preview payroll packet data as JSON (does not persist).
   *
   * Query Parameters:
   * - weekStart: Monday date in YYYY-MM-DD format (required)
   */
  @Get('v1/preview')
  async preview(@Query('weekStart') weekStart: string) {
    if (!weekStart) {
      throw new BadRequestException('weekStart query parameter is required');
    }

    const result = await this.packetService.generatePacketRows(weekStart);

    return {
      weekStart: result.weekStart,
      weekEnd: result.weekEnd,
      rowCount: result.rows.length,
      rows: result.rows,
      columns: [
        'SSN',
        'EmployeeName',
        'LOC',
        'RegRate',
        'RegHours',
        'OTHours',
        'DTHours',
        'HolidayHours',
        'BonusAmount',
        'ReimbAmount',
        'MileageAmount',
        'PerDiemAmount',
        'AdvanceDeductionAmount',
        'ETVDeductionAmount',
      ],
      v1Notes: {
        MileageAmount: 'Always 0 in v1 (not representable from existing data)',
      },
    };
  }

  /**
   * POST /payroll/packet/v1/generate?weekStart=YYYY-MM-DD
   *
   * Generate and persist payroll packet to database.
   *
   * Query Parameters:
   * - weekStart: Monday date in YYYY-MM-DD format (required)
   *
   * Note: Will fail if packet already exists for the specified week.
   */
  @Post('v1/generate')
  async generate(
    @Query('weekStart') weekStart: string,
    @Req() req: Request,
  ) {
    if (!weekStart) {
      throw new BadRequestException('weekStart query parameter is required');
    }

    // Extract user ID from request if available (depends on auth middleware)
    const userId = (req as any).user?.id || (req as any).user?.sub || null;

    const result = await this.packetService.generateAndPersistPacket(
      weekStart,
      userId,
    );

    return {
      success: true,
      packetId: result.packetId,
      weekStart: result.weekStart,
      weekEnd: result.weekEnd,
      rowCount: result.rows.length,
    };
  }
}

