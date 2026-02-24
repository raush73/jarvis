import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateCandidateDto {
  /**
   * Optional: allow caller to supply an ID (useful for controlled seeding).
   * If omitted, Prisma will generate one.
   */
  @IsOptional()
  @IsString()
  @Length(3, 80)
  id?: string;

  @IsOptional()
  @IsString()
  @Length(7, 30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  /**
   * Keep status as string (no migration). Phase 21.2 enforces availability values separately.
   * For create, allow setting status explicitly; if omitted we will default in service.
   */
  @IsOptional()
  @IsString()
  @Length(3, 40)
  status?: string;

  /**
   * JSON stored as string in SQLite/Prisma (existing schema uses String fields for these).
   * We keep these as optional strings so callers can pass '{}' safely.
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
