import { Module } from '@nestjs/common';
import { Ui14Controller } from './ui14.controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [Ui14Controller],
  providers: [PrismaService],
})
export class Ui14Module {}

