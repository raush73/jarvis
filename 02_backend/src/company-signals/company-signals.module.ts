import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CompanySignalsController } from './company-signals.controller';
import { CompanySignalsService } from './company-signals.service';
import { normalizeCompanyName } from '../utils/normalize-company-name';


@Module({
  imports: [PrismaModule],
  controllers: [CompanySignalsController],
  providers: [CompanySignalsService],
})
export class CompanySignalsModule {}
