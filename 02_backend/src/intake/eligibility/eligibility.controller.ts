import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminOnly } from '../../auth/admin-only.decorator';
import { EligibilityService } from './eligibility.service';

@Controller('admin/candidates')
@UseGuards(AuthGuard('jwt'))
export class EligibilityController {
  constructor(private readonly eligibilityService: EligibilityService) {}

  @AdminOnly()
  @Get(':candidateId/dispatch-eligibility')
  getDispatchEligibility(@Param('candidateId') candidateId: string) {
    return this.eligibilityService.getDispatchEligibility(candidateId);
  }
}

