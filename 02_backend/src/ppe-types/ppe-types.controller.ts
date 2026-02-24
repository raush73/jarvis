import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PpeTypesService } from './ppe-types.service';
import { CreatePpeTypeDto } from './dto/create-ppe-type.dto';
import { UpdatePpeTypeDto } from './dto/update-ppe-type.dto';

@Controller('ppe-types')
export class PpeTypesController {
  constructor(private readonly ppeTypesService: PpeTypesService) {}

  @Post()
  create(@Body() dto: CreatePpeTypeDto) {
    return this.ppeTypesService.create(dto);
  }

  @Get()
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.ppeTypesService.findAll(activeOnly === 'true');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePpeTypeDto) {
    return this.ppeTypesService.update(id, dto);
  }
}
