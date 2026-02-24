import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInvoicePaymentDto {
  @IsString()
  @IsNotEmpty()
  invoiceId!: string;

  @IsNumber()
  @Min(0.0000001)
  amount!: number;

  @IsDateString()
  paymentReceivedAt!: string;

  @IsDateString()
  paymentPostedAt!: string;

  @IsOptional()
  @IsDateString()
  bankDepositAt?: string;

  @IsOptional()
  @IsString()
  backdateReason?: string;

  @IsOptional()
  @IsString()
  source?: string;
}
