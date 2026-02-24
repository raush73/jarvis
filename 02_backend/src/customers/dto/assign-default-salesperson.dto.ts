import { IsString, IsOptional, ValidateIf } from 'class-validator';

/**
 * CUST-REL-01: Assign default salesperson to customer
 * Pass null to clear the assignment
 */
export class AssignDefaultSalespersonDto {
  @ValidateIf((o) => o.salespersonId !== null)
  @IsString()
  @IsOptional()
  salespersonId: string | null;
}


