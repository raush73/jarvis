import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PERMISSIONS } from '../auth/permissions.constants';
import { InvoicePaymentsService } from './invoice-payments.service';
import { CreateInvoicePaymentDto } from './dto/create-invoice-payment.dto';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('invoice-payments')
export class InvoicePaymentsController {
  constructor(private readonly invoicePayments: InvoicePaymentsService) {}

  @Permissions(PERMISSIONS.PAYMENTS_WRITE)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateInvoicePaymentDto) {
    const postedByUserId = req.user?.sub ?? req.user?.userId ?? req.user?.id;
  
    return this.invoicePayments.createPayment({
      invoiceId: dto.invoiceId,
      amount: dto.amount,
      paymentReceivedAt: new Date(dto.paymentReceivedAt),
      paymentPostedAt: new Date(dto.paymentPostedAt),
      bankDepositAt: dto.bankDepositAt
        ? new Date(dto.bankDepositAt)
        : undefined,
      postedByUserId,
      backdateReason: dto.backdateReason,
      source: dto.source,
    });
  }
  
}
