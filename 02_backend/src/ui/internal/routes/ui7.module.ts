import { Module } from '@nestjs/common';
import { Ui7Controller } from './ui7.controller';

@Module({
  controllers: [Ui7Controller],
  providers: [],
})
export class Ui7Module {}

