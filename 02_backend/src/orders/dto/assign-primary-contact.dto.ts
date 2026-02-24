import { IsString, IsOptional, ValidateIf } from 'class-validator';

/**
 * CUST-REL-01: Assign primary customer contact to job order
 * Pass null to clear the assignment
 */
export class AssignPrimaryContactDto {
  @ValidateIf((o) => o.contactId !== null)
  @IsString()
  @IsOptional()
  contactId: string | null;
}

