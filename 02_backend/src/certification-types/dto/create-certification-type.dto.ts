import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCertificationTypeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isMW4HTrainableDefault?: boolean;
}
