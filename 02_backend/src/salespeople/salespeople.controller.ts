import { Body, Controller, Delete, Get, Param, Patch, Post, NotFoundException } from '@nestjs/common';
import { SalespeopleService } from './salespeople.service';
import { CreateSalespersonDto } from './dto/create-salesperson.dto';
import { UpdateSalespersonDto } from './dto/update-salesperson.dto';

@Controller('salespeople')
export class SalespeopleController {
  constructor(private readonly service: SalespeopleService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSalespersonDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSalespersonDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // HARD DISABLED: Salespeople are historical records and may not be deleted.
    throw new NotFoundException();
  }
}


