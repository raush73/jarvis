import { IsOptional, IsString } from 'class-validator';

export class OverrideRoutingDto {
  @IsOptional()
  @IsString()
  note?: string;
}

