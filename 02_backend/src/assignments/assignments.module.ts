// PHASE 12.3 — Assignments Module
// LOCKED SCOPE: operations only (no hours, no billing, no payroll, no accounting)

import { Module } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecruitingModule } from '../recruiting/recruiting.module';

@Module({
  imports: [RecruitingModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService, PrismaService],
})
export class AssignmentsModule {}
