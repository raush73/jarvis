import { Module } from '@nestjs/common';
import { PpeTypesService } from './ppe-types.service';
import { PpeTypesController } from './ppe-types.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PpeTypesController],
  providers: [PpeTypesService, PrismaService],
  exports: [PpeTypesService],
})
export class PpeTypesModule {}
