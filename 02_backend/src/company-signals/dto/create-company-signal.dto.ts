import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateCompanySignalDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsString()
  @MinLength(2)
  sourceType: string;

  @IsString()
  @MinLength(2)
  rawCompanyName: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  rawContext?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  confidenceScore?: number;

  @IsOptional()
  @IsString()
  meta?: string;

}
