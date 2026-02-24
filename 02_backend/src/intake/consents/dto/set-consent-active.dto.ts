import { IsOptional, IsUUID, IsEnum, IsInt } from 'class-validator';
import { ConsentType } from '@prisma/client';

export class SetConsentActiveDto {
  @IsOptional()
  @IsUUID()
  consentVersionId?: string;

  @IsOptional()
  @IsEnum(ConsentType)
  type?: ConsentType;

  @IsOptional()
  @IsInt()
  version?: number;
}

