import { Module } from '@nestjs/common';
import { Ui12Controller } from './ui12.controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [Ui12Controller],
  providers: [PrismaService],
})
export class Ui12Module {}

