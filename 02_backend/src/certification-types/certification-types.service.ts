import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCertificationTypeDto } from './dto/create-certification-type.dto';
import { UpdateCertificationTypeDto } from './dto/update-certification-type.dto';

@Injectable()
export class CertificationTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCertificationTypeDto) {
    return this.prisma.certificationType.create({
      data: {
        code: dto.code.trim(),
        name: dto.name.trim(),
        category: dto.category?.trim(),
        isMW4HTrainableDefault: dto.isMW4HTrainableDefault ?? false,
        isActive: true,
      },
    });
  }

  async findAll(activeOnly?: boolean) {
    return this.prisma.certificationType.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async update(id: string, dto: UpdateCertificationTypeDto) {
    const existing = await this.prisma.certificationType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('CertificationType not found');
    }

    return this.prisma.certificationType.update({
      where: { id },
      data: {
        code: dto.code?.trim(),
        name: dto.name?.trim(),
        category: dto.category?.trim(),
        isMW4HTrainableDefault: dto.isMW4HTrainableDefault,
        isActive: dto.isActive,
      },
    });
  }
}
