import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PERMISSIONS } from '../auth/permissions.constants';
import { InvoicesService } from './invoices.service';
import { CreateInvoicePaymentNestedDto } from './dto/create-invoice-payment-nested.dto';
import { OverrideRoutingDto } from './dto/override-routing.dto';
import { AddInvoiceLineItemDto } from './dto/add-invoice-line-item.dto';
import { UpdateInvoiceLineItemDto } from './dto/update-invoice-line-item.dto';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('health')
  health() {
    return { ok: true };
  }

  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @Post('order/:orderId/create')
  createInvoiceForOrder(@Param('orderId') orderId: string) {
    return this.invoicesService.createInvoiceForOrder(orderId);
  }

  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @Post(':id/issue')
  issueInvoice(@Param('id') id: string, @Req() req: any) {
    const issuedByUserId = req.user?.userId ?? req.user?.sub;
    if (!issuedByUserId) {
      throw new ForbiddenException('User ID not found in request');
    }
    return this.invoicesService.issueInvoice(id, issuedByUserId);
  }

  /**
   * Phase 18+ Option A Step A7: List routed invoices (admin-only)
   */
  @Permissions(PERMISSIONS.ORDERS_READ)
  @Get('routed')
  async listRoutedInvoices() {
    return this.invoicesService.listRoutedInvoices();
  }

  /**
   * Get invoice PDF
   */
  @Permissions(PERMISSIONS.INVOICES_READ_CUSTOMER)
  @Get(':id/pdf')
  async getInvoicePdf(
    @Param('id') id: string,
    @Query('download') download: string,
    @Res({ passthrough: true }) res: Response,
    @Req() req: any,
  ) {
    const isDownload = download === 'true';
    const disposition = isDownload ? 'attachment' : 'inline';
    const filename = `invoice-${id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);

    return this.invoicesService.getInvoicePdf(id, req.user);
  }

  /**
   * B1–B4: Internal invoice view with adjustments and computed totals (read-only)
   */
  @Permissions(PERMISSIONS.ORDERS_READ)
  @Get(':id/internal-view')
  async getInternalInvoiceView(@Param('id') id: string) {
    return this.invoicesService.getInternalInvoiceView(id);
  }

  /**
   * Phase 17: Get invoice by ID with derived paid-state fields
   */
  @Permissions(PERMISSIONS.INVOICES_READ_CUSTOMER)
  @Get(':id')
  async getInvoiceById(@Param('id') id: string) {
    return this.invoicesService.getInvoiceById(id);
  }

  /**
   * Phase 17: Get all payments for an invoice
   */
  @Permissions(PERMISSIONS.PAYMENTS_READ_CUSTOMER)
  @Get(':id/payments')
  async getPaymentsForInvoice(@Param('id') id: string) {
    return this.invoicesService.getPaymentsForInvoice(id);
  }

  /**
   * Phase 17: Create payment for an invoice
   */
  @Permissions(PERMISSIONS.PAYMENTS_READ_CUSTOMER)
  @Post(':id/payments')
  async createPaymentForInvoice(
    @Param('id') invoiceId: string,
    @Body() dto: CreateInvoicePaymentNestedDto,
    @Req() req: any,
  ) {
    const postedByUserId = req.user?.userId ?? req.user?.sub;
    if (!postedByUserId) {
      throw new ForbiddenException('User ID not found in request');
    }

    return this.invoicesService.createPaymentForInvoice(invoiceId, {
      amount: dto.amount,
      paymentReceivedAt: new Date(dto.paymentReceivedAt),
      paymentPostedAt: new Date(dto.paymentPostedAt),
      bankDepositAt: dto.bankDepositAt ? new Date(dto.bankDepositAt) : undefined,
      postedByUserId,
      backdateReason: dto.backdateReason,
      source: dto.source,
    });
  }

  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @Post(':id/override-routing')
  overrideRouting(@Param('id') id: string, @Body() dto: OverrideRoutingDto, @Req() req: any) {
    const userId = req.user?.userId ?? req.user?.sub;
    if (!userId) throw new ForbiddenException('User ID not found in request');
    return this.invoicesService.overrideRouting(id, userId, dto?.note);
  }

  /**
   * Phase 18+ Option A — Step A8.2
   * Admin approves a routed invoice
   */
  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @Post(':id/approve-admin')
  async approveRoutedInvoice(
    @Param('id') invoiceId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.userId ?? req.user?.sub;
    if (!userId) throw new ForbiddenException('User ID not found in request');
    return this.invoicesService.approveRoutedInvoice(invoiceId, userId);
  }

  // -------------------------------
  // Step 3 — Draft Line Item Composition
  // -------------------------------

  /**
   * Add line item to draft invoice
   */
  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @Post(':id/line-items')
  async addLineItem(
    @Param('id') invoiceId: string,
    @Body() dto: AddInvoiceLineItemDto,
  ) {
    return this.invoicesService.addLineItem(invoiceId, dto);
  }

  /**
   * Update line item on draft invoice
   */
  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @Patch(':id/line-items/:lineItemId')
  async updateLineItem(
    @Param('id') invoiceId: string,
    @Param('lineItemId') lineItemId: string,
    @Body() dto: UpdateInvoiceLineItemDto,
  ) {
    return this.invoicesService.updateLineItem(invoiceId, lineItemId, dto);
  }

  /**
   * Remove line item from draft invoice
   */
  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @Delete(':id/line-items/:lineItemId')
  async removeLineItem(
    @Param('id') invoiceId: string,
    @Param('lineItemId') lineItemId: string,
  ) {
    return this.invoicesService.removeLineItem(invoiceId, lineItemId);
  }
}

