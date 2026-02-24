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

  findAll() {
    return this.prisma.salesperson.findMany();
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

    const isProtected =
      (existing.firstName === 'House' && existing.lastName === 'Account') ||
      existing.email === 'mike@mw4h.com';

    if (isProtected) {
      throw new ForbiddenException(
        'This salesperson is a protected system record and cannot be edited or deactivated.',
      );
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
