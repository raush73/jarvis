import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePpeTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
