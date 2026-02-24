import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePpeTypeDto } from './dto/create-ppe-type.dto';
import { UpdatePpeTypeDto } from './dto/update-ppe-type.dto';

@Injectable()
export class PpeTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePpeTypeDto) {
    return this.prisma.ppeType.create({
      data: {
        name: dto.name.trim(),
        isActive: true,
      },
    });
  }

  async findAll(activeOnly?: boolean) {
    return this.prisma.ppeType.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: UpdatePpeTypeDto) {
    const existing = await this.prisma.ppeType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('PpeType not found');

    return this.prisma.ppeType.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        isActive: dto.isActive,
      },
    });
  }
}
