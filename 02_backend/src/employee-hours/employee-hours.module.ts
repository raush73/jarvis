import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmployeeHoursService } from './employee-hours.service';
import { EmployeeHoursController } from './employee-hours.controller';

@Module({
  imports: [PrismaModule],
  providers: [EmployeeHoursService],
  controllers: [EmployeeHoursController],
})
export class EmployeeHoursModule {}

