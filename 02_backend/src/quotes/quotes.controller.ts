import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { AddQuoteLineDto } from './dto/add-quote-line.dto';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  async createQuote(@Body() dto: CreateQuoteDto) {
    return this.quotesService.createQuote(dto);
  }

  @Post(':id/lines')
  async addLine(@Param('id') id: string, @Body() dto: AddQuoteLineDto) {
    return this.quotesService.addLine(id, dto);
  }

  @Post(':id/generate')
  async generate(@Param('id') id: string) {
    return this.quotesService.generate(id);
  }

  @Get(':id')
  async getQuote(@Param('id') id: string) {
    return this.quotesService.getQuote(id);
  }
}
