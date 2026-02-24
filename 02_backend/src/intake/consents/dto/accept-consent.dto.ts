import { IsUUID, IsOptional, IsString } from 'class-validator';

export class AcceptConsentDto {
  @IsUUID()
  candidateId: string;

  @IsUUID()
  consentVersionId: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

