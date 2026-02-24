import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PERMISSIONS } from '../auth/permissions.constants';
import { CompanySignalsService } from './company-signals.service';
import { CreateCompanySignalDto } from './dto/create-company-signal.dto';

@Controller('company-signals')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class CompanySignalsController {
  constructor(private readonly companySignalsService: CompanySignalsService) {}

  @Post()
  @Permissions(PERMISSIONS.companySignals.write)
  create(@Body() dto: CreateCompanySignalDto) {
    return this.companySignalsService.create(dto);
  }

  @Get()
  @Permissions(PERMISSIONS.companySignals.read)
  findAll() {
    return this.companySignalsService.findAll();
  }
}
