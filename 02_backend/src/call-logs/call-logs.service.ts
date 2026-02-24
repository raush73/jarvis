import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCallLogDto } from './dto/create-call-log.dto';

@Injectable()
export class CallLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCallLogDto) {
    return this.prisma.callLog.create({
      data: {
        companyId: dto.companyId,
        userId,
        calledAt: dto.calledAt ? new Date(dto.calledAt) : new Date(),
        disposition: dto.disposition,
        notes: dto.notes,
      },
    });
  }

  async findRecentByUser(userId: string, days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.callLog.findMany({
      where: {
        userId,
        calledAt: {
          gte: since,
        },
      },
      orderBy: {
        calledAt: 'desc',
      },
    });
  }
}
