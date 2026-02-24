import { FinanceModule } from '../finance/finance.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoicePaymentsService } from './invoice-payments.service';
import { InvoicePaymentsController } from './invoice-payments.controller';


@Module({
  imports: [PrismaModule, FinanceModule, CommissionsModule],
  providers: [InvoicePaymentsService],
  exports: [InvoicePaymentsService],
  controllers: [InvoicePaymentsController],
})
export class InvoicePaymentsModule {}

