import type { ReportItem } from './generate-report';
import type { ExpectedService, Pm2ProcessInfo } from './check-pm2';

type Severity = 'HIGH' | 'MED' | 'LOW';
type Status = 'PASS' | 'FAIL' | 'WARN';

interface EnvIdentity {
  name: string;
  expectedPort?: number;
  port?: number;
  nodeEnv?: string;
  appEnv?: string;
  dbName?: string;
}

function parseDbName(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\//, '');
    return path || undefined;
  } catch {
    return undefined;
  }
}

function toIdentity(
  service: ExpectedService,
  process?: Pm2ProcessInfo
): EnvIdentity {
  const env = process?.env ?? {};
  const port = env.PORT ? Number.parseInt(env.PORT, 10) : undefined;
  const dbName =
    env.DB_NAME ??
    env.POSTGRES_DB ??
    parseDbName(env.DATABASE_URL) ??
    undefined;

  return {
    name: service.name,
    expectedPort: service.port,
    port,
    nodeEnv: env.NODE_ENV,
    appEnv: env.APP_ENV ?? env.RUNTIME_ENV ?? env.ENVIRONMENT,
    dbName,
  };
}

function bumpSeverity(current: Severity, next: Severity): Severity {
  const order: Severity[] = ['LOW', 'MED', 'HIGH'];
  return order.indexOf(next) > order.indexOf(current) ? next : current;
}

export function checkEnvIdentity(
  processes: Pm2ProcessInfo[],
  expected: ExpectedService[]
): { items: ReportItem[] } {
  const backendServices = expected.filter((service) => service.role === 'backend');
  const identities = backendServices.map((service) => {
    const process = processes.find((proc) => proc.name === service.name);
    return toIdentity(service, process);
  });

  const items: ReportItem[] = identities.map((identity) => {
    const details: string[] = [];
    let status: Status = 'PASS';
    let severity: Severity = 'LOW';

    if (identity.expectedPort && identity.port) {
      if (identity.expectedPort !== identity.port) {
        status = 'FAIL';
        severity = bumpSeverity(severity, 'HIGH');
        details.push(
          `PORT mismatch (${identity.port} != ${identity.expectedPort})`
        );
      } else {
        details.push(`PORT ${identity.port}`);
      }
    } else if (identity.expectedPort && !identity.port) {
      status = status === 'FAIL' ? status : 'WARN';
      severity = bumpSeverity(severity, 'MED');
      details.push('PORT env missing');
    }

    if (identity.dbName) {
      details.push(`DB ${identity.dbName}`);
    } else {
      status = status === 'FAIL' ? status : 'WARN';
      severity = bumpSeverity(severity, 'MED');
      details.push('DB name not detected');
    }

    if (identity.nodeEnv) {
      details.push(`NODE_ENV ${identity.nodeEnv}`);
    }
    if (identity.appEnv) {
      details.push(`APP_ENV ${identity.appEnv}`);
    }

    return {
      label: identity.name,
      status,
      severity,
      details: details.join(' | '),
    };
  });

  const dbNames = identities
    .map((identity) => identity.dbName)
    .filter((name): name is string => Boolean(name));

  if (dbNames.length >= 2) {
    const uniqueNames = new Set(dbNames);
    items.push({
      label: 'backend DB segregation',
      status: uniqueNames.size === dbNames.length ? 'PASS' : 'FAIL',
      severity: uniqueNames.size === dbNames.length ? 'LOW' : 'HIGH',
      details:
        uniqueNames.size === dbNames.length
          ? 'Distinct DB names across backends'
          : 'DB name collision detected',
    });
  } else {
    items.push({
      label: 'backend DB segregation',
      status: 'WARN',
      severity: 'MED',
      details: 'Insufficient DB metadata to compare environments',
    });
  }

  return { items };
}
