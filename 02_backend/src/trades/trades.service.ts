import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';

@Injectable()
export class TradesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTradeDto) {
    return this.prisma.trade.create({
      data: {
        name: dto.name.trim(),
        isActive: true,
      },
    });
  }

  async findAll(activeOnly?: boolean) {
    return this.prisma.trade.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: UpdateTradeDto) {
    const existing = await this.prisma.trade.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Trade not found');
    }

    return this.prisma.trade.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        isActive: dto.isActive,
      },
    });
  }
}
