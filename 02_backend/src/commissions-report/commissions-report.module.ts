import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommissionsReportController } from './commissions-report.controller';
import { CommissionsReportService } from './commissions-report.service';

@Module({
  imports: [PrismaModule],
  controllers: [CommissionsReportController],
  providers: [CommissionsReportService],
})
export class CommissionsReportModule {}
