import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class HoursEntryLineInputDto {
  @IsIn(['REG', 'OT', 'DT', 'H', 'PD', 'TRV', 'BONUS', 'REM'])
  earningCode: string;

  @IsIn(['HOURS', 'DAYS', 'DOLLARS'])
  unit: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  rate?: number;

  @IsOptional()
  @IsNumber()
  amount?: number;
}

export class CreateOfficialHoursMw4hDto {
  @IsString()
  orderId: string;

  @IsString()
  workerId: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  // TEMP BACK-COMPAT: existing callers can still send totalHours.
  // If lines is provided, service will ignore totalHours.
  @IsOptional()
  @IsNumber()
  totalHours?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HoursEntryLineInputDto)
  lines?: HoursEntryLineInputDto[];
}


