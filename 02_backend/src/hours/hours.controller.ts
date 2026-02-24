import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PERMISSIONS } from '../auth/permissions.constants';
import { CreateOfficialHoursCustomerDto } from './dto/create-official-hours-customer.dto';
import { CreateOfficialHoursMw4hDto } from './dto/create-official-hours-mw4h.dto';
import { CreateReferenceHoursEmployeeDto } from './dto/create-reference-hours-employee.dto';
import { HoursService } from './hours.service';

@Controller('hours')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class HoursController {
  constructor(private readonly hoursService: HoursService) {}

  private getUserId(req: any): string {
    return req.user?.userId ?? req.user?.sub;
  }

  private canReadAllHours(req: any): boolean {
    const user = req.user;
    if (!user) return false;

    // Check if user has permissions array
    if (Array.isArray(user.permissions)) {
      if (user.permissions.includes(PERMISSIONS.HOURS_READ_ALL)) {
        return true;
      }
    }

    // Fallback: check if user is admin (via roles)
    if (Array.isArray(user.roles) && user.roles.includes('admin')) {
      return true;
    }

    return false;
  }

  @Get('health')
  health() {
    return { ok: true };
  }

  @Post('official/customer')
  officialCustomer(@Body() dto: CreateOfficialHoursCustomerDto) {
    return this.hoursService.createOfficialHoursCustomer(dto);
  }

  @Post('official/mw4h')
  officialMw4h(@Body() dto: CreateOfficialHoursMw4hDto) {
    return this.hoursService.createOfficialHoursMw4h(dto);
  }

  @Post('reference/employee')
  referenceEmployee(@Body() dto: CreateReferenceHoursEmployeeDto) {
    return this.hoursService.createReferenceHoursEmployee(dto);
  }

  @Get()
  @Permissions(PERMISSIONS.HOURS_READ_ALL, PERMISSIONS.HOURS_READ_SELF)
  findAll(@Req() req: any) {
    const canReadAll = this.canReadAllHours(req);
    if (canReadAll) {
      return this.hoursService.findAll();
    }
    const userId = this.getUserId(req);
    return this.hoursService.findAllByWorker(userId);
  }

  @Get('order/:orderId')
  @Permissions(PERMISSIONS.HOURS_READ_ALL, PERMISSIONS.HOURS_READ_SELF)
  findByOrder(@Req() req: any, @Param('orderId') orderId: string) {
    const canReadAll = this.canReadAllHours(req);
    if (canReadAll) {
      return this.hoursService.findByOrder(orderId);
    }
    const userId = this.getUserId(req);
    return this.hoursService.findByOrderAndWorker(orderId, userId);
  }

  @Get('worker/:workerId')
  @Permissions(PERMISSIONS.HOURS_READ_ALL, PERMISSIONS.HOURS_READ_SELF)
  findByWorker(@Req() req: any, @Param('workerId') workerId: string) {
    const canReadAll = this.canReadAllHours(req);
    if (canReadAll) {
      return this.hoursService.findByWorker(workerId);
    }
    
    // If user can only read self, ensure they're requesting their own data
    const userId = this.getUserId(req);
    if (workerId !== userId) {
      throw new ForbiddenException('You can only view your own hours');
    }
    
    return this.hoursService.findByWorker(workerId);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.hoursService.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.hoursService.reject(id);
  }

  @Patch(':id/resolve')
  @Permissions(PERMISSIONS.HOURS_RESOLVE_REJECTED)
  resolveRejected(@Param('id') id: string, @Req() req: any) {
    const userPermissions = req.user?.permissions || [];
    return this.hoursService.resolveRejectedHours(id, userPermissions);
  }
}

