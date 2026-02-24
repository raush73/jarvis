import { Module } from '@nestjs/common';
import { Ui16Controller } from './ui16.controller';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [Ui16Controller],
})
export class Ui16Module {}

