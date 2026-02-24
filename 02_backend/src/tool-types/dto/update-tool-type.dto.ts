import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateToolTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
