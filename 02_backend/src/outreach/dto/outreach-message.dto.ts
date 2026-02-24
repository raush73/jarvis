import {
    IsArray,
    IsEmail,
    IsIn,
    IsISO8601,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
  } from "class-validator";
  import { Type } from "class-transformer";
  
  // Phase 23.3 — Outreach Payload Contract (Option C)
  // Rules (locked):
  // - Candidate-facing summary includes: Trade, City/State, Pay rate, Start date, Duration (weeks),
  //   Estimated hours/week, Per diem.
  // - Conditional: Travel pay + Bonuses only if present for that job.
  // - Inside magic link page adds PPE required + Tools required.
  // - Links are action-scoped magic links with expiry.
  
  export class JobLocationDto {
    @IsString()
    city!: string;
  
    @IsString()
    state!: string;
  }
  
  export class PayRateDto {
    @IsNumber()
    @Min(0)
    amount!: number;
  
    @IsIn(["hr", "day", "week"])
    unit!: "hr" | "day" | "week";
  }
  
  export class PerDiemDto {
    @IsNumber()
    @Min(0)
    amount!: number;
  
    @IsIn(["day", "week"])
    unit!: "day" | "week";
  }
  
  export class TravelPayDto {
    @IsNumber()
    @Min(0)
    amount!: number;
  
    @IsIn(["flat", "mile", "day"])
    unit!: "flat" | "mile" | "day";
  }
  
  export class BonusDto {
    @IsString()
    label!: string;
  
    @IsNumber()
    @Min(0)
    amount!: number;
  
    @IsIn(["flat", "day", "week"])
    unit!: "flat" | "day" | "week";
  }
  
  export class OpportunityPayloadDto {
    @IsString()
    orderId!: string;
  
    @IsString()
    trade!: string;
  
    @IsObject()
    @ValidateNested()
    @Type(() => JobLocationDto)
    jobLocation!: JobLocationDto;
  
    @IsObject()
    @ValidateNested()
    @Type(() => PayRateDto)
    payRate!: PayRateDto;
  
    // ISO date string (YYYY-MM-DD is acceptable ISO8601)
    @IsISO8601()
    startDate!: string;
  
    @IsNumber()
    @Min(0)
    durationWeeks!: number;
  
    @IsNumber()
    @Min(0)
    estimatedHoursPerWeek!: number;
  
    @IsObject()
    @ValidateNested()
    @Type(() => PerDiemDto)
    perDiem!: PerDiemDto;
  
    // Optional: only if present for this job/order
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => TravelPayDto)
    travelPay?: TravelPayDto;
  
    // Optional: only if present for this job/order
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BonusDto)
    bonuses?: BonusDto[];
  
    // Shown inside the link page (adds detail)
    @IsArray()
    @IsString({ each: true })
    ppeRequired!: string[];
  
    // Shown inside the link page (adds detail)
    @IsArray()
    @IsString({ each: true })
    toolsRequired!: string[];
  }
  
  export class MagicLinkDto {
    @IsString()
    token!: string;
  
    // ISO datetime
    @IsISO8601()
    expiresAt!: string;
  }
  
  export class OutreachMessageDto {
    @IsIn(["sms", "email"])
    channel!: "sms" | "email";
  
    @IsString()
    candidateId!: string;
  
    // Required if channel === sms
    @IsOptional()
    @IsString()
    candidatePhone?: string;
  
    // Required if channel === email
    @IsOptional()
    @IsEmail()
    candidateEmail?: string;
  
    @IsObject()
    @ValidateNested()
    @Type(() => OpportunityPayloadDto)
    opportunity!: OpportunityPayloadDto;
  
    @IsObject()
    @ValidateNested()
    @Type(() => MagicLinkDto)
    magicLink!: MagicLinkDto;
  }
  