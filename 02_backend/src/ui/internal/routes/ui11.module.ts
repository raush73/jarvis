import { Module } from '@nestjs/common';
import { Ui11Controller } from './ui11.controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [Ui11Controller],
  providers: [PrismaService],
})
export class Ui11Module {}
