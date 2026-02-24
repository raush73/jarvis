import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  Header,
  BadRequestException,
  ForbiddenException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeeHoursService } from './employee-hours.service';
import { EmployeeHoursSelfReportSubmitDto } from './dto/employee-hours-self-report-submit.dto';
import * as crypto from 'crypto';
import { assertUiUnlockedOrThrow, UiLockedError, UI_LOCK_ERROR_CODE } from './employee-hours.lock';

@Controller('magic')
export class EmployeeHoursController {
  constructor(
    private readonly employeeHoursService: EmployeeHoursService,
    private readonly prisma: PrismaService,
  ) {}

  // UI-4A: Employee Self-Report (Reference Only) - Mobile-first HTML page (presentation only)
  // NOTE: URL segment matches the template's token extraction logic.
  @Get('employee-hours-self-report/:token/ui')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async renderSelfReportPage(@Param('token') token: string) {
    return this.employeeHoursService.renderSelfReportPage(token);
  }

  @Post('employee-hours/:token')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async submitSelfReport(
    @Param('token') token: string,
    @Body() dto: EmployeeHoursSelfReportSubmitDto,
  ) {
    // Validate magic token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const link = await this.prisma.magicLink.findFirst({
      where: {
        tokenHash,
        scope: 'EMPLOYEE_HOURS_SELF_REPORT',
        expiresAt: { gt: new Date() },
      },
      select: {
        userId: true,
        orderId: true,
        usedAt: true,
      },
    });

    if (!link) {
      throw new ForbiddenException('Invalid or expired token.');
    }

    // Extract employeeId and orderId from token payload/scope
    const employeeId = link.userId;
    const orderId = link.orderId;

    if (!employeeId || !orderId) {
      throw new BadRequestException('Token missing employeeId or orderId.');
    }

    try {
      await assertUiUnlockedOrThrow({ orderId });
    } catch (e: any) {
      if (e instanceof UiLockedError) {
        throw new BadRequestException({ ok: false, errorId: UI_LOCK_ERROR_CODE, reason: e.reason });
      }
      throw e;
    }

    // Validate endTime > startTime if both provided
    if (dto.startTime && dto.endTime) {
      const start = new Date(dto.startTime);
      const end = new Date(dto.endTime);
      if (end <= start) {
        throw new BadRequestException('endTime must be after startTime');
      }
    }

    // Call service
    const saved = await this.employeeHoursService.submitSelfReport(
      employeeId,
      orderId,
      dto,
    );

    // Return exact shape
    return {
      ok: true,
      id: saved.id,
      employeeId: saved.employeeId,
      orderId: saved.orderId,
      workDate: saved.workDate.toISOString().split('T')[0], // ISO date string
      totalMinutes: saved.totalMinutes ?? null,
      startTime: saved.startTime ? saved.startTime.toISOString() : null,
      endTime: saved.endTime ? saved.endTime.toISOString() : null,
    };
  }
}