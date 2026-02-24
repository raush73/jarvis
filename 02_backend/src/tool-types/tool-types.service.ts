import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolTypeDto } from './dto/create-tool-type.dto';
import { UpdateToolTypeDto } from './dto/update-tool-type.dto';

@Injectable()
export class ToolTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateToolTypeDto) {
    return this.prisma.toolType.create({
      data: {
        name: dto.name.trim(),
        isActive: true,
      },
    });
  }

  async findAll(activeOnly?: boolean) {
    return this.prisma.toolType.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: UpdateToolTypeDto) {
    const existing = await this.prisma.toolType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('ToolType not found');

    return this.prisma.toolType.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        isActive: dto.isActive,
      },
    });
  }
}
