import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PayrollBurdenModule } from '../payroll-burden/payroll-burden.module';
import { SettingsModule } from '../settings/settings.module';
import { BurdenSnapshotGuard } from './burden-snapshot.guard';
import { TradeMarginSnapshotService } from './trade-margin-snapshot.service';

@Module({
  imports: [PrismaModule, PayrollBurdenModule, SettingsModule],
  providers: [TradeMarginSnapshotService, BurdenSnapshotGuard],
  exports: [TradeMarginSnapshotService],
})
export class FinanceModule {}
