import { RequirementPriority, RequirementEnforcement } from '@prisma/client';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderTradeRequirementDto {
  @IsString()
  @IsNotEmpty()
  tradeId: string;

  // RequirementPriority enum in Prisma (optional; defaults in DB)
  @IsOptional()
  @IsString()
  priority?: RequirementPriority;

  // RequirementEnforcement enum in Prisma (optional; defaults in DB)
  @IsOptional()
  @IsString()
  enforcement?: RequirementEnforcement;

  @IsOptional()
  @IsString()
  notes?: string;

  // Decimal fields — keep as string to avoid float precision loss
  @IsOptional()
  @IsString()
  basePayRate?: string;

  @IsOptional()
  @IsString()
  baseBillRate?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sdPayDeltaRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sdBillDeltaRate?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderTradeRequirementDto)
  tradeRequirements?: CreateOrderTradeRequirementDto[];
}
