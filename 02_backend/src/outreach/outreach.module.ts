import { PublicCandidateJobInterestController } from './public-candidate-job-interest.controller';
import { Module } from '@nestjs/common';
import { OutreachService } from './outreach.service';
import { OutreachController } from './outreach.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MagicLinksModule } from '../magic-links/magic-links.module';

@Module({
  imports: [PrismaModule, MagicLinksModule],
  providers: [OutreachService],
  controllers: [OutreachController, PublicCandidateJobInterestController],
  exports: [OutreachService],
})
export class OutreachModule {}
