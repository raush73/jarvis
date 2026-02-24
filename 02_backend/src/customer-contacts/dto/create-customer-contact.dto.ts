import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsArray,
  IsEnum,
  IsBoolean,
} from 'class-validator';

/**
 * CUST-REL-01: Customer Contact Role enum
 * Must match CustomerContactRole values in schema.prisma
 * Dropdowns and logic MUST rely on roles, NEVER jobTitle.
 */
export enum CustomerContactRole {
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  EXECUTIVE = 'EXECUTIVE',
  AP = 'AP',
  SAFETY = 'SAFETY',
  SITE_SUPERVISOR = 'SITE_SUPERVISOR',
  OTHER = 'OTHER',
}

export class CreateCustomerContactDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

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

