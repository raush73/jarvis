import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateInvoiceAdjustmentDto {
  @IsString()
  invoiceId!: string;

  @IsEnum(['CREDIT', 'DEBIT'])
  type!: 'CREDIT' | 'DEBIT';

  @IsInt()
  @Min(1)
  amountCents!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

