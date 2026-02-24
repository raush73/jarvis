import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateTradeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
