import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { CustomerContactRole } from './create-customer-contact.dto';

export class UpdateCustomerContactDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  officePhone?: string;

  @IsOptional()
  @IsString()
  cellPhone?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(CustomerContactRole, { each: true })
  roles?: CustomerContactRole[];

  @IsOptional()
  @IsString()
  salespersonOfRecordUserId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

