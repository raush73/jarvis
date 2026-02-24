import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomerContactsService } from './customer-contacts.service';
import { CreateCustomerContactDto } from './dto/create-customer-contact.dto';
import { UpdateCustomerContactDto } from './dto/update-customer-contact.dto';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PERMISSIONS } from '../auth/permissions.constants';

/**
 * CUST-REL-01: Customer Contacts Controller
 * CRUD endpoints for universal customer contacts
 */
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('customer-contacts')
export class CustomerContactsController {
  constructor(private readonly customerContactsService: CustomerContactsService) {}

  /**
   * Create a new customer contact
   */
  @Permissions(PERMISSIONS.CUSTOMER_CONTACTS_WRITE)
  @Post()
  create(@Body() dto: CreateCustomerContactDto) {
    return this.customerContactsService.create(dto);
  }

  /**
   * Get all contacts for a customer
   * Query param: includeInactive=true to include deactivated contacts
   */
  @Permissions(PERMISSIONS.CUSTOMER_CONTACTS_READ)
  @Get('customer/:customerId')
  findByCustomer(
    @Param('customerId') customerId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.customerContactsService.findByCustomer(
      customerId,
      includeInactive === 'true',
    );
  }

  /**
   * Get a single contact by ID
   */
  @Permissions(PERMISSIONS.CUSTOMER_CONTACTS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerContactsService.findOne(id);
  }

  /**
   * Update a customer contact
   */
  @Permissions(PERMISSIONS.CUSTOMER_CONTACTS_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerContactDto) {
    return this.customerContactsService.update(id, dto);
  }

  /**
   * Soft-delete (deactivate) a contact
   */
  @Permissions(PERMISSIONS.CUSTOMER_CONTACTS_WRITE)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.customerContactsService.deactivate(id);
  }
}

