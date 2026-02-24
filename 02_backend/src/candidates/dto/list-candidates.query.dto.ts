import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class ListCandidatesQueryDto {
  /**
   * Optional filter by availability status.
   * Allowed: ACTIVE_SEEKING | NOT_ACTIVE
   */
  @IsOptional()
  @IsIn(['ACTIVE_SEEKING', 'NOT_ACTIVE'])
  status?: string;

  /**
   * Optional search string (simple contains match).
   * We will apply it to email/phone/id in the service.
   */
  @IsOptional()
  @IsString()
  @Length(1, 120)
  q?: string;
}
