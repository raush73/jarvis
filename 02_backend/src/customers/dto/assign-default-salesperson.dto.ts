import { IsString, IsOptional, ValidateIf } from 'class-validator';

/**
 * CUST-REL-01: Assign default salesperson to customer
 * Pass null to clear the assignment
 */
export class AssignDefaultSalespersonDto {
  @ValidateIf((o) => o.salespersonUserId !== null)
  @IsString()
  @IsOptional()
  salespersonUserId: string | null;
}

