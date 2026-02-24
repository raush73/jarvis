import { Module } from '@nestjs/common';
import { ApplicationsModule } from './applications/applications.module';
import { ConsentsModule } from './consents/consents.module';
import { EligibilityModule } from './eligibility/eligibility.module';

@Module({
  imports: [ApplicationsModule, ConsentsModule, EligibilityModule],
  exports: [ApplicationsModule, ConsentsModule, EligibilityModule],
})
export class IntakeModule {}

