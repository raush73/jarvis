import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTradeDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
