import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateSalespersonDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
