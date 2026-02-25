import { Controller, Post, Body, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AssignDefaultSalespersonDto } from './dto/assign-default-salesperson.dto';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PERMISSIONS } from '../auth/permissions.constants';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Permissions(PERMISSIONS.CUSTOMERS_WRITE)
  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Permissions(PERMISSIONS.CUSTOMERS_READ)
  @Get()
  findAll(
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('state') state?: string,
  ) {
    return this.customersService.findAll({
      take: take ? parseInt(take, 10) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
      search: search ?? undefined,
      sort: sort ?? undefined,
      order: order ?? undefined,
      state: state ?? undefined,
    });
}

  @Permissions(PERMISSIONS.CUSTOMERS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Permissions(PERMISSIONS.CUSTOMERS_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  /**
   * CUST-REL-01: Assign default salesperson to customer
   * Purpose: Owner of customer profile, default commission attribution fallback
   */
  @Permissions(PERMISSIONS.CUSTOMERS_WRITE)
  @Permissions(PERMISSIONS.CUSTOMERS_WRITE)
  @Patch(':id/default-salesperson')
  assignRegistrySalesperson(
    @Param('id') id: string,
    @Body() dto: AssignDefaultSalespersonDto,
  ) {
    return this.customersService.assignRegistrySalesperson(id, dto.salespersonId ?? null);
  }
}




