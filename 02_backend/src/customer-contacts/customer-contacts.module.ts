import { Module } from '@nestjs/common';
import { CustomerContactsController } from './customer-contacts.controller';
import { CustomerContactsService } from './customer-contacts.service';

/**
 * CUST-REL-01: Customer Contacts Module
 * Universal customer-side contacts (no PM entity)
 */
@Module({
  controllers: [CustomerContactsController],
  providers: [CustomerContactsService],
  exports: [CustomerContactsService],
})
export class CustomerContactsModule {}

