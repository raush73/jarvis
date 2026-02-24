import * as path from 'path';
import { Injectable, BadRequestException } from '@nestjs/common';
import { readHtml } from '../ui/internal/ui-html.util';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeeHoursSelfReportSubmitDto } from './dto/employee-hours-self-report-submit.dto';

@Injectable()
export class EmployeeHoursService {
  constructor(private readonly prisma: PrismaService) {}

  async submitSelfReport(
    employeeId: string,
    orderId: string,
    dto: EmployeeHoursSelfReportSubmitDto,
  ) {
    // Compute totalMinutes
    let totalMinutes: number | null = null;

    if (dto.totalMinutes !== undefined && dto.totalMinutes !== null) {
      totalMinutes = Math.floor(dto.totalMinutes);
    } else if (dto.startTime && dto.endTime) {
      const start = new Date(dto.startTime);
      const end = new Date(dto.endTime);
      const diffMs = end.getTime() - start.getTime();
      totalMinutes = Math.floor(diffMs / (1000 * 60));
    }

    // Validate endTime > startTime if both provided
    if (dto.startTime && dto.endTime) {
      const start = new Date(dto.startTime);
      const end = new Date(dto.endTime);
      if (end <= start) {
        throw new BadRequestException('endTime must be after startTime');
      }
    }

    // Normalize workDate to start of day (DATE-only)
    const workDate = new Date(dto.workDate);
    workDate.setUTCHours(0, 0, 0, 0);

    // Prepare data for upsert
    const data: any = {
      employeeId,
      orderId,
      workDate,
      totalMinutes,
      note: dto.note ?? null,
    };

    // Only include startTime/endTime if provided
    if (dto.startTime) {
      data.startTime = new Date(dto.startTime);
    }
    if (dto.endTime) {
      data.endTime = new Date(dto.endTime);
    }

    // Upsert by unique key (employeeId, orderId, workDate)
    const saved = await this.prisma.employeeHoursSelfReport.upsert({
      where: {
        employeeId_orderId_workDate: {
          employeeId,
          orderId,
          workDate,
        },
      },
      update: data,
      create: data,
    });

    return saved;
  }
  // UI-4A: Employee Self-Report (Reference Only) - HTML (presentation only)
  // NOTE: Token is extracted client-side by the template; server returns static HTML.
  renderSelfReportPage(_token: string) {
    const filePath = path.join(__dirname, '../magic/templates/employee-hours-self-report.html');
    return readHtml(filePath);
  }
}
