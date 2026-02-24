import { IsEnum, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateInvoiceLineItemDto {
  @IsOptional()
  @IsEnum([
    'TRADE_SALES',
    'TRADE_LABOR',
    'BONUS',
    'TRAVEL',
    'PER_DIEM',
    'REIMBURSEMENT',
    'FEE',
    'OTHER',
    'MOB_DEMOB',
    'CREDIT',
    'DISCOUNT',
    'BACK_CHARGE',
  ])
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  tradeCode?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsBoolean()
  isCommissionable?: boolean;
}

