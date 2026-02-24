import { Module } from '@nestjs/common';
import { Ui9Controller } from './ui9.controller';

@Module({
  controllers: [Ui9Controller],
  providers: [],
})
export class Ui9Module {}
