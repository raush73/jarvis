import { execSync } from 'child_process';
import type { ReportItem } from './generate-report';

export interface ExpectedService {
  name: string;
  role: 'backend' | 'frontend';
  port?: number;
}

export interface Pm2ProcessInfo {
  name: string;
  status: string;
  restartCount: number;
  unstableRestarts: number;
  pid?: number;
  env: Record<string, string>;
  pm2Env: Record<string, unknown>;
}

function isRestartLoop(info: Pm2ProcessInfo): boolean {
  return info.unstableRestarts > 0 || info.restartCount >= 5;
}

export function checkPm2(expected: ExpectedService[]): {
  items: ReportItem[];
  processes: Pm2ProcessInfo[];
  raw: string;
} {
  const output = execSync('pm2 jlist', { encoding: 'utf-8' });
  const list = JSON.parse(output) as Array<Record<string, unknown>>;

  const processes: Pm2ProcessInfo[] = list.map((entry) => {
    const name = String(entry.name ?? '');
    const pm2Env = (entry.pm2_env ?? {}) as Record<string, unknown>;
    const env = (pm2Env.env ?? {}) as Record<string, string>;
    return {
      name,
      status: String(pm2Env.status ?? 'unknown'),
      restartCount: Number(pm2Env.restart_time ?? 0),
      unstableRestarts: Number(pm2Env.unstable_restarts ?? 0),
      pid: typeof entry.pid === 'number' ? entry.pid : undefined,
      env,
      pm2Env,
    };
  });

  const items: ReportItem[] = expected.map((service) => {
    const match = processes.find((proc) => proc.name === service.name);
    if (!match) {
      return {
        label: service.name,
        status: 'FAIL',
        severity: 'HIGH',
        details: 'Missing PM2 app',
      };
    }

    if (match.status !== 'online') {
      return {
        label: service.name,
        status: 'FAIL',
        severity: 'HIGH',
        details: `Status ${match.status}`,
      };
    }

    if (isRestartLoop(match)) {
      return {
        label: service.name,
        status: 'FAIL',
        severity: 'MED',
        details: `Restart loop (${match.restartCount} restarts)`,
      };
    }

    return {
      label: service.name,
      status: 'PASS',
      severity: 'LOW',
      details: `Online (pid ${match.pid ?? 'n/a'})`,
    };
  });

  return { items, processes, raw: output };
}
