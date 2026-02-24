import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PERMISSIONS } from '../auth/permissions.constants';
import { CallLogsService } from './call-logs.service';
import { CreateCallLogDto } from './dto/create-call-log.dto';

@Controller('call-logs')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class CallLogsController {
  constructor(private readonly callLogsService: CallLogsService) {}

  private getUserId(req: any): string {
    const userId = req.user?.userId ?? req.user?.sub;
    return userId;
  }

  @Post()
  @Permissions(PERMISSIONS.callLogs.write)
  async create(@Req() req: any, @Body() dto: CreateCallLogDto) {
    const userId = this.getUserId(req);
    return this.callLogsService.create(userId, dto);
  }

  @Get()
  @Permissions(PERMISSIONS.callLogs.read)
  async list(@Req() req: any, @Query('days') days?: string) {
    const userId = this.getUserId(req);
    const windowDays = days ? Math.max(1, Math.min(365, Number(days))) : 30;
    return this.callLogsService.findRecentByUser(userId, windowDays);
  }
}
