import { Module } from '@nestjs/common';
import { EligibilityController } from './eligibility.controller';
import { EligibilityService } from './eligibility.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [EligibilityController],
  providers: [EligibilityService, PrismaService],
  exports: [EligibilityService],
})
export class EligibilityModule {}

