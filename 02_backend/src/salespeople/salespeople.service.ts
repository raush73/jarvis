import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalespersonDto } from './dto/create-salesperson.dto';
import { UpdateSalespersonDto } from './dto/update-salesperson.dto';

@Injectable()
export class SalespeopleService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateSalespersonDto) {
    return this.prisma.salesperson.create({
      data: dto,
    });
  }

  async findAll() {
    const records = await this.prisma.salesperson.findMany({
      include: {
        _count: { select: { customers: true } },
      },
    });

    return records.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone,
      isActive: r.isActive,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      customersOwned: r._count.customers,
      defaultCommissionPlanName: null as string | null,
      lastActivityAt: r.updatedAt,
    }));
  }

  async findOne(id: string) {
    const record = await this.prisma.salesperson.findUnique({
      where: { id },
    });

    if (!record) throw new NotFoundException('Salesperson not found');
    return record;
  }

  async update(id: string, dto: UpdateSalespersonDto) {
    const existing = await this.findOne(id);

    const isHouse =
      existing.firstName === 'House' && existing.lastName === 'Account';
    const isMike = (existing.email ?? '').toLowerCase() === 'mike@mw4h.com';

    const isProtected = isHouse || isMike;

    if (isProtected) {
      // Never allow deactivation for protected records
      if (dto.isActive === false) {
        throw new ForbiddenException(
          'This salesperson is a protected system record and cannot be deactivated.',
        );
      }

      // Never allow name changes for protected records
      const nextFirst = (dto.firstName ?? existing.firstName).trim();
      const nextLast = (dto.lastName ?? existing.lastName).trim();

      if (nextFirst !== existing.firstName || nextLast !== existing.lastName) {
        throw new ForbiddenException(
          'This salesperson is a protected system record and name fields cannot be edited.',
        );
      }

      // Email/phone edits are allowed for protected records
    }

    return this.prisma.salesperson.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    throw new ForbiddenException('Salespeople cannot be deleted.');
  }
}
