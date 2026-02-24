import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PayrollBurdenModule } from '../payroll-burden/payroll-burden.module';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [PrismaModule, PayrollBurdenModule],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule {}
