import { Module } from '@nestjs/common';
import { InvoiceAdjustmentsController } from './invoice-adjustments.controller';
import { InvoiceAdjustmentsService } from './invoice-adjustments.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [InvoiceAdjustmentsController],
  providers: [InvoiceAdjustmentsService, PrismaService],
})
export class InvoiceAdjustmentsModule {}

