import { IsBoolean, IsIn, IsInt, IsString } from 'class-validator';

const CONSENT_TYPES = [
  'ELECTRONIC_COMMUNICATIONS',
  'DATA_STORAGE',
  'LOCATION_ARRIVAL_VERIFICATION',
  'SAFETY_VIDEO_TRACKING',
] as const;

export type ConsentTypeStr = (typeof CONSENT_TYPES)[number];

export class CreateConsentVersionDto {
  @IsIn(CONSENT_TYPES)
  type: ConsentTypeStr;

  @IsInt()
  version: number;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsBoolean()
  isActive: boolean;
}
