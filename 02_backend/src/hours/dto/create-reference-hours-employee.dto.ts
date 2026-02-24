import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PayrollEarningCode, HoursEntryUnit } from '@prisma/client';

class ReferenceHoursLineDto {
  @IsEnum(PayrollEarningCode)
  earningCode: PayrollEarningCode;

  @IsEnum(HoursEntryUnit)
  unit: HoursEntryUnit;

  @IsNumber()
  quantity: number;
}

export class CreateReferenceHoursEmployeeDto {
  @IsString()
  orderId: string;

  @IsString()
  workerId: string;

  @IsDateString()
  periodStart: string; // ISO date string

  @IsDateString()
  periodEnd: string; // ISO date string

  // Back-compat: still allowed when no lines[] are provided.
  @IsOptional()
  @IsNumber()
  totalHours?: number;

  // New: optional line-items for reference-only employee submissions.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenceHoursLineDto)
  lines?: ReferenceHoursLineDto[];
}

