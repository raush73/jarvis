import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';

@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post()
  create(@Body() dto: CreateTradeDto) {
    return this.tradesService.create(dto);
  }

  @Get()
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.tradesService.findAll(activeOnly === 'true');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTradeDto) {
    return this.tradesService.update(id, dto);
  }
}
