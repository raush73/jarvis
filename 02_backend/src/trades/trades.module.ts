import { Module } from '@nestjs/common';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TradesController],
  providers: [TradesService, PrismaService],
  exports: [TradesService],
})
export class TradesModule {}
