import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminOnly } from '../auth/admin-only.decorator';
import { PayrollBurdenService } from './payroll-burden.service';
import { CreatePayrollBurdenRateDto } from './dto/create-payroll-burden-rate.dto';
import { UpdatePayrollBurdenRateDto } from './dto/update-payroll-burden-rate.dto';

@Controller('payroll-burden-rates')
@UseGuards(AuthGuard('jwt'))
export class PayrollBurdenController {
  constructor(private readonly payrollBurden: PayrollBurdenService) {}

  @Get()
  @AdminOnly()
  async list(@Query() q: any) {
    return this.payrollBurden.listRates({
      level: q.level ?? null,
      category: q.category ?? null,
      workerId: q.workerId ?? null,
      locationId: q.locationId ?? null,
      stateCode: q.stateCode ?? null,
    });
  }

  @Post()
  @AdminOnly()
  async create(@Req() req: any, @Body() dto: CreatePayrollBurdenRateDto) {
    const userId = req?.user?.sub ?? req?.user?.id ?? null;
    return this.payrollBurden.createRate({ dto, userId });
  }

  @Patch(':id')
  @AdminOnly()
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePayrollBurdenRateDto) {
    const userId = req?.user?.sub ?? req?.user?.id ?? null;
    return this.payrollBurden.updateRate({ id, dto, userId });
  }

  @Delete(':id')
  @AdminOnly()
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = req?.user?.sub ?? req?.user?.id ?? null;
    return this.payrollBurden.deleteRate({ id, userId });
  }

  @Get(':id/audits')
  @AdminOnly()
  async audits(@Param('id') id: string) {
    return this.payrollBurden.listAudits({ id });
  }
}
