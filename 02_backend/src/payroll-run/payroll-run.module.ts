import { Module } from '@nestjs/common';
import { PayrollModule } from '../payroll/payroll.module';
import { PayrollRunService } from './payroll-run.service';
import { PayrollRunController } from './payroll-run.controller';

@Module({
  imports: [PayrollModule],
  providers: [PayrollRunService],
  controllers: [PayrollRunController],
})
export class PayrollRunModule {}
