import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollRunService {
  constructor(private readonly prisma: PrismaService) {}

  async createPayrollRun(args: {
    weekStart: Date;
    weekEnd: Date;
    timezone: string;
    snapshotJson: unknown;
    includeDeductions: boolean;
    includeReference: boolean;
    finalizedByUserId?: string | null;
  }) {
    return this.prisma.payrollRun.create({
      data: {
        weekStart: args.weekStart,
        weekEnd: args.weekEnd,
        timezone: args.timezone,
        snapshotJson: args.snapshotJson as any,
        includeDeductions: args.includeDeductions,
        includeReference: args.includeReference,
        finalizedByUserId: args.finalizedByUserId ?? null,
      },
    });
  }

  async getPayrollRunById(id: string) {
    return this.prisma.payrollRun.findUnique({
      where: { id },
    });
  }
}
