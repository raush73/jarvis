import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PayrollBurdenService } from './payroll-burden.service';
import { PayrollBurdenController } from './payroll-burden.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PayrollBurdenController],
  providers: [PayrollBurdenService],
  exports: [PayrollBurdenService],
})
export class PayrollBurdenModule {}
