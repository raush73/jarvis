import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class CreateCallLogDto {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsISO8601()
  calledAt?: string;

  @IsOptional()
  @IsString()
  disposition?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
