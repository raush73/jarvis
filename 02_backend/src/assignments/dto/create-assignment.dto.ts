// PHASE 12.2 — Create Assignment DTO
// LOCKED SCOPE: operations only

import { IsUUID, IsOptional, IsDateString } from 'class-validator';

export class CreateAssignmentDto {
  @IsUUID()
  orderId: string;

  @IsUUID()
  userId: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
