import { IsString, IsOptional, Length } from 'class-validator';

export class CreateQuoteDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsString()
  @Length(1, 255)
  title: string;

  @IsString()
  @Length(2, 2)
  state: string;
}
