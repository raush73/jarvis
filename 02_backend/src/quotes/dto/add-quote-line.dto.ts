import { IsString, IsNumber, Min } from 'class-validator';

export class AddQuoteLineDto {
  @IsString()
  tradeId: string;

  @IsNumber()
  @Min(0)
  baseRate: number;
}
