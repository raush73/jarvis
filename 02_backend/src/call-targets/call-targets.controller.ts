import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PERMISSIONS } from '../auth/permissions.constants';
import { CallTargetsService } from './call-targets.service';

@Controller('call-targets')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class CallTargetsController {
  constructor(private readonly callTargetsService: CallTargetsService) {}

  @Get()
  @Permissions(PERMISSIONS.companies.read)
  async getCallTargets(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('includeZero') includeZero?: string,
    @Query('suppressDays') suppressDays?: string,
  ) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.sub;

    const parsedLimit = limit ? Number(limit) : 25;
    const safeLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 25;

    const include = (includeZero ?? '').toLowerCase() === 'true';

    const suppressDaysNum = suppressDays ? Number(suppressDays) : 30;
    const finalSuppressDays = Number.isFinite(suppressDaysNum) ? suppressDaysNum : 30;

    const data = await this.callTargetsService.getRankedCallTargets(
      safeLimit,
      userId,
      finalSuppressDays,
    );

    return {
      ok: data.ok,
      limit: data.limit,
      totalCompanies: data.totalCompanies,
      meta: {
        suppressDays: finalSuppressDays,
        suppressedCount: data.suppressedCount ?? 0,
      },
      value: include ? data.rankedAll : data.rankedFiltered,
    };
  }
}
