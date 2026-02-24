import { Module } from '@nestjs/common';
import { ToolTypesService } from './tool-types.service';
import { ToolTypesController } from './tool-types.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ToolTypesController],
  providers: [ToolTypesService, PrismaService],
  exports: [ToolTypesService],
})
export class ToolTypesModule {}
