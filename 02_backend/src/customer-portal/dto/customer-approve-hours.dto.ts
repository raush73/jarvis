import { IsEnum, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';

export enum HoursApprovalDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class CustomerApproveHoursDto {
  @IsEnum(HoursApprovalDecision)
  decision: HoursApprovalDecision;

  @ValidateIf((o) => o.decision === HoursApprovalDecision.REJECTED)
  @IsNotEmpty({ message: 'Rejection reason is required when rejecting hours' })
  rejectionReason?: string;
}

