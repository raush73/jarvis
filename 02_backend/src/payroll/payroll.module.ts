import { Module } from '@nestjs/common';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceCutoffService } from '../invoices/invoice-cutoff.service';
import { PacketModule } from './packet/packet.module';

@Module({
  imports: [PacketModule],
  controllers: [PayrollController],
  providers: [PayrollService, PrismaService, InvoiceCutoffService],
  exports: [PayrollService],
})
export class PayrollModule {}
