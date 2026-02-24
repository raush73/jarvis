import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminOnly } from '../../auth/admin-only.decorator';
import { ConsentsService } from './consents.service';
import { CreateConsentVersionDto } from './dto/create-consent-version.dto';
import { SetConsentActiveDto } from './dto/set-consent-active.dto';
import { AcceptConsentDto } from './dto/accept-consent.dto';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class ConsentsController {
  constructor(private readonly consentsService: ConsentsService) {}

  @AdminOnly()
  @Post('admin/consents/versions')
  createVersion(@Body() dto: CreateConsentVersionDto) {
    return this.consentsService.createVersion(dto);
  }

  @AdminOnly()
  @Post('admin/consents/versions/:id/activate')
  activateVersion(@Param('id') id: string) {
    return this.consentsService.activateVersion({ consentVersionId: id });
  }

  @Get('consents/active')
  getActiveVersions() {
    return this.consentsService.getActiveVersions();
  }

  @AdminOnly()
  @Post('admin/consents/accept')
  acceptConsent(@Body() dto: AcceptConsentDto) {
    return this.consentsService.acceptConsent(dto);
  }

  @AdminOnly()
  @Get('admin/candidates/:candidateId/consents')
  getCandidateConsents(@Param('candidateId') candidateId: string) {
    return this.consentsService.getCandidateConsents(candidateId);
  }
}

