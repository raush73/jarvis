import { Module } from '@nestjs/common';
import { Ui10Controller } from './ui10.controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [Ui10Controller],
  providers: [PrismaService],
})
export class Ui10Module {}