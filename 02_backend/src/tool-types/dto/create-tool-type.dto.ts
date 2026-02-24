import { IsNotEmpty, IsString } from 'class-validator';

export class CreateToolTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
