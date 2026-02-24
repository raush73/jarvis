import { IsArray, IsBoolean, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ChannelsDto {
  @IsBoolean()
  sms!: boolean;

  @IsBoolean()
  email!: boolean;
}

export class CreateOutreachDto {
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
}
