import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PERMISSIONS } from '../auth/permissions.constants';
import { InvoiceAdjustmentsService } from './invoice-adjustments.service';
import { CreateInvoiceAdjustmentDto } from './dto/create-invoice-adjustment.dto';
import { UpdateInvoiceAdjustmentDto } from './dto/update-invoice-adjustment.dto';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('invoice-adjustments')
export class InvoiceAdjustmentsController {
  constructor(private readonly invoiceAdjustmentsService: InvoiceAdjustmentsService) {}

  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @Post()
  create(@Body() dto: CreateInvoiceAdjustmentDto) {
    return this.invoiceAdjustmentsService.create({
      invoiceId: dto.invoiceId,
      type: dto.type,
      amountCents: dto.amountCents,
      reason: dto.reason,
    });
  }

  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceAdjustmentDto) {
    return this.invoiceAdjustmentsService.update(id, {
      type: dto.type,
      amountCents: dto.amountCents,
      reason: dto.reason,
    });
  }

  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @Post(':id/issue')
  issue(@Param('id') id: string, @Req() req: any) {
    const issuedByUserId = req.user?.userId ?? req.user?.sub;
    if (!issuedByUserId) {
      throw new ForbiddenException('User ID not found in request');
    }
    return this.invoiceAdjustmentsService.issue(id, issuedByUserId);
  }

  @Permissions(PERMISSIONS.ORDERS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoiceAdjustmentsService.findOne(id);
  }
}

