import { IsOptional, IsString } from 'class-validator';

export class UpdateCandidateDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  /**
   * Marker fields
   * Stored as JsonValue in Prisma
   * API accepts stringified JSON
   */
  @IsOptional()
  @IsString()
  tools?: string;

  @IsOptional()
  @IsString()
  ppe?: string;

  @IsOptional()
  @IsString()
  safetyRecords?: string;
}
