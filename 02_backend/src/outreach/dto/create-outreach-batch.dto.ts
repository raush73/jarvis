import { IsArray, IsBoolean, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ChannelsDto {
  @IsBoolean()
  sms!: boolean;

  @IsBoolean()
  email!: boolean;
}

export class CreateOutreachBatchDto {
  @IsArray()
  @IsString({ each: true })
  candidateIds!: string[];

  @IsIn(['RECOMMENDED', 'FILTERED', 'MANUAL'])
  sourceType!: 'RECOMMENDED' | 'FILTERED' | 'MANUAL';

  @ValidateNested()
  @Type(() => ChannelsDto)
  channels!: ChannelsDto;

  @IsOptional()
  @IsString()
  templateKey?: string;

  /**
   * Rendered final outbound message body (snapshot).
   * Deterministic: what we send is what we store.
   */
  @IsString()
  messageSnapshot!: string;
}
