import { Module } from '@nestjs/common';
import { SalespeopleService } from './salespeople.service';
import { SalespeopleController } from './salespeople.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SalespeopleController],
  providers: [SalespeopleService, PrismaService],
})
export class SalespeopleModule {}
