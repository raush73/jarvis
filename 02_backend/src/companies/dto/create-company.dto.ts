import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MinLength(2)
  legalName: string;

 
  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  domain?: string;
}
