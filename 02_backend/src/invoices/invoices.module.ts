import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoiceRecipientsService } from './invoice-recipients.service';
import { InvoiceCutoffService } from './invoice-cutoff.service';
import { InvoiceApprovalRoutingService } from './invoice-approval-routing.service';
import { PrismaService } from '../prisma/prisma.service';
import { InvoicePaymentsModule } from '../invoice-payments/invoice-payments.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [InvoicePaymentsModule, SettingsModule],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    InvoiceRecipientsService,
    InvoiceCutoffService,
    InvoiceApprovalRoutingService,
    PrismaService,
  ],
  exports: [InvoiceRecipientsService, InvoiceCutoffService],
})
export class InvoicesModule {}

