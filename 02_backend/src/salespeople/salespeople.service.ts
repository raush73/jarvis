import { Injectable, NotFoundException } from '@nestjs/common';
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
    await this.findOne(id);

    return this.prisma.salesperson.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.salesperson.delete({
      where: { id },
    });
  }
}
