import { Controller, Get, Post, Body, NotFoundException } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

// DEV-ONLY: Static demo trades
const DEMO_TRADES = [
  { id: 'trade_millwright', name: 'Millwright' },
  { id: 'trade_welder', name: 'Welder' },
  { id: 'trade_pipefitter', name: 'Pipefitter' },
];

// DEV-ONLY: Burden fixture map (State × Trade)
const BURDEN_MAP: Record<string, Record<string, number>> = {
  KY: {
    trade_millwright: 0.42,
    trade_welder: 0.39,
    trade_pipefitter: 0.41,
  },
  TX: {
    trade_millwright: 0.44,
    trade_welder: 0.40,
    trade_pipefitter: 0.43,
  },
};

interface BurdenedRatesInput {
  stateCode: string;
  tradeId: string;
  baseRate: number;
}

@Public()
@Controller('demo')
export class DemoController {
  @Get('trades')
  getTrades() {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    return DEMO_TRADES;
  }

  @Post('burdened-rates')
  calculateBurdenedRates(@Body() input: BurdenedRatesInput) {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }

    const { stateCode, tradeId, baseRate } = input;

    const stateBurdens = BURDEN_MAP[stateCode] ?? {};
    const burdenPct = stateBurdens[tradeId] ?? 0.40;

    const burdenMultiplier = 1 + burdenPct;
    const reg = Math.round(baseRate * burdenMultiplier * 100) / 100;
    const ot = Math.round(baseRate * 1.5 * burdenMultiplier * 100) / 100;
    const dt = Math.round(baseRate * 2.0 * burdenMultiplier * 100) / 100;

    return {
      stateCode,
      tradeId,
      baseRate,
      burdenPct,
      rates: { reg, ot, dt },
    };
  }
}
