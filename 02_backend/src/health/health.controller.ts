import { Controller, Get, Res } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import type { Response } from 'express';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get('healthz')
  healthz() {
    return {
      ok: true,
      service: 'jarvis-backend',
      ts: new Date().toISOString(),
    };
  }

  @Public()
  @Get('readyz')
  async readyz(@Res() res: Response) {
    const dbOk = await this.healthService.checkDatabase();
    if (dbOk) {
      return res.status(200).json({ ok: true });
    } else {
      return res.status(503).json({ ok: false, reason: 'DB_UNAVAILABLE' });
    }
  }
}



