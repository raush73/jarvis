import { Module } from '@nestjs/common';
import { CustomerInvoiceController } from './customer-invoice.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { MagicLinksModule } from '../../../magic-links/magic-links.module';
import { SettingsModule } from '../../../settings/settings.module';

@Module({
  imports: [PrismaModule, MagicLinksModule, SettingsModule],
  controllers: [CustomerInvoiceController],
})
export class CustomerInvoiceModule {}

