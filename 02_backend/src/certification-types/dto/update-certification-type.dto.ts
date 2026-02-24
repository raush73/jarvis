import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateCertificationTypeDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isMW4HTrainableDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
