import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePpeTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
