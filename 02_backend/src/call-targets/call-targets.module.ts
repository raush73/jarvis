import { Module } from '@nestjs/common';
import { CallTargetsService } from './call-targets.service';
import { CallTargetsController } from './call-targets.controller';

@Module({
  providers: [CallTargetsService],
  controllers: [CallTargetsController]
})
export class CallTargetsModule {}
