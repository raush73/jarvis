import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateSalespersonDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

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
