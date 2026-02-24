import { Module } from '@nestjs/common';
import { Ui8Controller } from './ui8.controller';

@Module({
  controllers: [Ui8Controller],
})
export class Ui8Module {}
