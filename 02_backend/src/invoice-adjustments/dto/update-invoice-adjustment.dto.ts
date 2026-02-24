import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateInvoiceAdjustmentDto {
  @IsOptional()
  @IsEnum(['CREDIT', 'DEBIT'])
  type?: 'CREDIT' | 'DEBIT';

  @IsOptional()
  @IsInt()
  @Min(1)
  amountCents?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

