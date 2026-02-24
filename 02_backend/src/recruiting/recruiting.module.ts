import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrderCandidateService } from './order-candidate.service';
import { OrderVettingService } from './order-vetting.service';

@Module({
  imports: [PrismaModule],
  providers: [OrderCandidateService, OrderVettingService],
  exports: [OrderCandidateService, OrderVettingService],
})
export class RecruitingModule {}

