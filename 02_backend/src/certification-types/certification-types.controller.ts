import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CertificationTypesService } from './certification-types.service';
import { CreateCertificationTypeDto } from './dto/create-certification-type.dto';
import { UpdateCertificationTypeDto } from './dto/update-certification-type.dto';

@Controller('certification-types')
export class CertificationTypesController {
  constructor(
    private readonly certificationTypesService: CertificationTypesService,
  ) {}

  @Post()
  create(@Body() dto: CreateCertificationTypeDto) {
    return this.certificationTypesService.create(dto);
  }

  @Get()
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.certificationTypesService.findAll(activeOnly === 'true');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCertificationTypeDto) {
    return this.certificationTypesService.update(id, dto);
  }
}
