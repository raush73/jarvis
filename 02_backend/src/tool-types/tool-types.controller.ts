import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ToolTypesService } from './tool-types.service';
import { CreateToolTypeDto } from './dto/create-tool-type.dto';
import { UpdateToolTypeDto } from './dto/update-tool-type.dto';

@Controller('tool-types')
export class ToolTypesController {
  constructor(private readonly toolTypesService: ToolTypesService) {}

  @Post()
  create(@Body() dto: CreateToolTypeDto) {
    return this.toolTypesService.create(dto);
  }

  @Get()
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.toolTypesService.findAll(activeOnly === 'true');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateToolTypeDto) {
    return this.toolTypesService.update(id, dto);
  }
}
