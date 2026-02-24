import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PERMISSIONS } from '../auth/permissions.constants';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AssignPrimaryContactDto } from './dto/assign-primary-contact.dto';
import { OutreachService } from '../outreach/outreach.service';
import { CreateOutreachBatchDto } from '../outreach/dto/create-outreach-batch.dto';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly outreachService: OutreachService,
  ) {}

  @Permissions(PERMISSIONS.ORDERS_READ)
  @Get()
  listOrders() {
    return this.ordersService.listOrders();
  }

  @Permissions(PERMISSIONS.ORDERS_READ)
  @Get(':id')
  findOrderById(@Param('id') id: string) {
    return this.ordersService.findOrderById(id);
  }

  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @Post()
  createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: any,
  ) {
    const userPermissions = req.user?.permissions || [];
    return this.ordersService.updateOrderStatus(id, dto.status, userPermissions);
  }

  // Phase 4.7.7 — non-status updates only (service blocks status changes)
  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @Patch(':id')
  updateOrder(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.updateOrder(id, dto);
  }

  // Phase 24: create outreach batch for an order (persists recipients + magic links)
  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @Post(':id/outreach')
  createOutreachBatch(
    @Param('id') id: string,
    @Body() dto: CreateOutreachBatchDto,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.userId || 'UNKNOWN_USER';
    return this.outreachService.createBatchForOrder({
      orderId: id,
      createdByUserId: userId,
      dto,
    });
  }

  /**
   * CUST-REL-01: Assign primary customer contact to job order
   * Dropdown populated from that customer's ACTIVE contacts
   */
  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @Patch(':id/primary-contact')
  assignPrimaryContact(
    @Param('id') id: string,
    @Body() dto: AssignPrimaryContactDto,
  ) {
    return this.ordersService.assignPrimaryCustomerContact(id, dto.contactId);
  }
}
