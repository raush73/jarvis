#!/usr/bin/env node
/**
 * Infra Sentinel — Local + Remote runtime health checks
 * Validates frontend, backend, auth, and proxy layer.
 */
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

const REPORTS_DIR = path.resolve(__dirname, '..', 'reports');

export interface CliOptions {
  mode: string;
  baseUrl: string;
  backendUrl: string;
  demoEmail: string;
  demoPassword: string;
}

export interface CheckResult {
  name: string;
  ok: boolean;
  ms: number;
  detail: string;
}

export interface Failure {
  code: string;
  message: string;
  next_step: string;
}

export interface SentinelReport {
  status: 'GO' | 'NO_GO';
  checks: CheckResult[];
  failures: Failure[];
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    mode: 'local',
    baseUrl: 'http://localhost:3000',
    backendUrl: 'http://127.0.0.1:3002',
    demoEmail: 'michael+demo@mw4h.com',
    demoPassword: 'Passw0rd!',
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case '--mode': opts.mode = next; i++; break;
      case '--baseUrl': opts.baseUrl = next; i++; break;
      case '--backendUrl': opts.backendUrl = next; i++; break;
      case '--demoEmail': opts.demoEmail = next; i++; break;
      case '--demoPassword': opts.demoPassword = next; i++; break;
    }
  }
  return opts;
}

function httpRequest(
  reqUrl: string,
  options: { method?: string; body?: string; headers?: Record<string, string> } = {},
): Promise<{ status: number; body: string; ok: boolean }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(reqUrl);
    const mod = parsed.protocol === 'https:' ? https : http;
    const hdrs: Record<string, string> = { ...(options.headers || {}) };
    if (options.body) {
      hdrs['Content-Type'] = 'application/json';
      hdrs['Content-Length'] = String(Buffer.byteLength(options.body));
    }
    const req = mod.request(
      parsed,
      { method: options.method || 'GET', headers: hdrs },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf-8');
          const code = res.statusCode ?? 0;
          resolve({ status: code, body, ok: code >= 200 && code < 400 });
        });
      },
    );
    req.on('error', (err) => reject(err));
    req.setTimeout(10_000, () => {
      req.destroy(new Error('timeout'));
    });
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function timedCheck(
  name: string,
  fn: () => Promise<{ ok: boolean; detail: string }>,
): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const { ok, detail } = await fn();
    return { name, ok, ms: Date.now() - t0, detail };
  } catch (err: any) {
    return { name, ok: false, ms: Date.now() - t0, detail: err.message ?? String(err) };
  }
}

function nextStepFor(checkName: string): string {
  switch (checkName) {
    case 'frontend-reachable':
      return 'Ensure the Next.js dev server is running: cd 03_frontend && npm run dev';
    case 'backend-readyz':
      return 'Ensure the NestJS backend is running: cd 02_backend && npm run start:dev';
    case 'auth-login':
      return 'Verify demo user exists; run prisma seed or check auth module logs.';
    case 'customers-proxy':
      return 'Check next.config rewrites and backend /customers route.';
    default:
      return 'Investigate the failing check manually.';
  }
}

export async function run(opts?: Partial<CliOptions>): Promise<SentinelReport> {
  const o: CliOptions = {
    mode: opts?.mode ?? 'local',
    baseUrl: opts?.baseUrl ?? 'http://localhost:3000',
    backendUrl: opts?.backendUrl ?? 'http://127.0.0.1:3002',
    demoEmail: opts?.demoEmail ?? 'michael+demo@mw4h.com',
    demoPassword: opts?.demoPassword ?? 'Passw0rd!',
  };

  const checks: CheckResult[] = [];
  const failures: Failure[] = [];
  let token: string | undefined;

  checks.push(
    await timedCheck('frontend-reachable', async () => {
      const res = await httpRequest(o.baseUrl + '/');
      return { ok: true, detail: `HTTP ${res.status}` };
    }),
  );

  checks.push(
    await timedCheck('backend-readyz', async () => {
      for (const ep of ['/readyz', '/health', '/']) {
        try {
          const res = await httpRequest(o.backendUrl + ep);
          if (res.ok) return { ok: true, detail: `${ep} → HTTP ${res.status}` };
        } catch {
          /* try next endpoint */
        }
      }
      return { ok: false, detail: 'All health endpoints failed' };
    }),
  );

  checks.push(
    await timedCheck('auth-login', async () => {
      const res = await httpRequest(o.backendUrl + '/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: o.demoEmail, password: o.demoPassword }),
      });
      let parsed: any;
      try {
        parsed = JSON.parse(res.body);
      } catch {
        /* not JSON */
      }
      if (parsed?.accessToken) {
        token = parsed.accessToken;
        return { ok: true, detail: 'accessToken received' };
      }
      return { ok: false, detail: `HTTP ${res.status} – no accessToken` };
    }),
  );

  checks.push(
    await timedCheck('customers-proxy', async () => {
      const hdrs: Record<string, string> = {};
      if (token) hdrs['Authorization'] = `Bearer ${token}`;
      const res = await httpRequest(o.baseUrl + '/api/customers', { headers: hdrs });
      let parsed: any;
      try {
        parsed = JSON.parse(res.body);
      } catch {
        /* not JSON */
      }
      const items = Array.isArray(parsed) ? parsed : parsed?.data;
      if (res.ok && items) {
        return { ok: true, detail: `ok, ${Array.isArray(items) ? items.length : '?'} customers` };
      }
      return { ok: false, detail: `HTTP ${res.status}` };
    }),
  );

  for (const c of checks) {
    if (!c.ok) {
      failures.push({
        code: c.name,
        message: c.detail,
        next_step: nextStepFor(c.name),
      });
    }
  }

  const report: SentinelReport = {
    status: failures.length === 0 ? 'GO' : 'NO_GO',
    checks,
    failures,
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'infra-sentinel.json'),
    JSON.stringify(report, null, 2),
  );

  return report;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);
  console.log('INFRA SENTINEL');
  console.log('----------------\n');
  console.log(`Mode: ${opts.mode}  Base: ${opts.baseUrl}  Backend: ${opts.backendUrl}\n`);

  const report = await run(opts);

  for (const c of report.checks) {
    const icon = c.ok ? 'PASS' : 'FAIL';
    console.log(`[${icon}] ${c.name} (${c.ms}ms) — ${c.detail}`);
  }
  console.log('');

  if (report.failures.length > 0) {
    console.log('Failures:');
    for (const f of report.failures) {
      console.log(`  ${f.code}: ${f.message}`);
      console.log(`  → ${f.next_step}`);
    }
  }

  console.log(`\nStatus: ${report.status}`);
  console.log(`Report: bots/reports/infra-sentinel.json`);

  if (report.status === 'NO_GO') process.exit(1);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`Infra Sentinel failed: ${err.message ?? err}`);
    process.exit(1);
  });
}
