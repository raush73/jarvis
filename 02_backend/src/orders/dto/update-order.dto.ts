import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOrderDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sdPayDeltaRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sdBillDeltaRate?: number;
}

