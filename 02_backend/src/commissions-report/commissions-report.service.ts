import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CommissionsReportService {
  constructor(private readonly prisma: PrismaService) {}

  async createWeeklyRun(params: { weekStart: Date; weekEnd: Date; createdByUserId: string }): Promise<{ reportRunId: string }> {
    const run = await this.prisma.commissionReportRun.create({
      data: { weekStart: params.weekStart, weekEnd: params.weekEnd, createdByUserId: params.createdByUserId },
      select: { id: true },
    });
    return { reportRunId: run.id };
  }

  async finalizeRun(reportRunId: string, finalizedByUserId: string): Promise<void> {
    const run = await this.prisma.commissionReportRun.findUnique({
      where: { id: reportRunId },
      select: { id: true, status: true },
    });
    if (!run) return;
    if (run.status === 'FINALIZED') return;
    await this.prisma.commissionReportRun.update({
      where: { id: reportRunId },
      data: { status: 'FINALIZED', finalizedAt: new Date(), finalizedByUserId },
      select: { id: true },
    });
  }

  async exportCsv(reportRunId: string): Promise<Buffer> {
    const run = await this.prisma.commissionReportRun.findUnique({
      where: { id: reportRunId },
      include: { items: { include: { commissionEvent: true } } },
    });
    if (!run) return Buffer.from("");

    const header = [
      "reportRunId",
      "weekStart",
      "weekEnd",
      "commissionEventId",
      "employeeId",
      "amount",
      "finalized"
    ].join(",");

    const rows = run.items.map(i => [
      run.id,
      run.weekStart.toISOString(),
      run.weekEnd.toISOString(),
      i.commissionEvent.id,
      i.commissionEvent.userId,
      i.commissionEvent.commissionRateSnapshot.toFixed(2),
      run.status === 'FINALIZED' ? 'TRUE' : 'FALSE'
    ].join(","));

    return Buffer.from([header, ...rows].join("\n") + "\n");
  }
}
