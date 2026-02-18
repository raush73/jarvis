#!/usr/bin/env node
/**
 * Log Triage + Fix Capsule Launcher
 * Analyzes logs, matches known error signatures, generates fix prompts.
 */
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../..');
const REPORTS_DIR = path.resolve(__dirname, '..', 'reports');

export interface CliOptions {
  logFile?: string;
  mode: string;
  lines: number;
  hours: number;
}

export interface ErrorMatch {
  signature: string;
  excerpt: string;
  likelyCause: string;
  confirmCommand: string;
  fixCapsulePrompt: string;
}

export interface TriageReport {
  status: 'GO' | 'NO_GO';
  topErrors: ErrorMatch[];
}

const SIGNATURES: Array<{
  pattern: RegExp;
  signature: string;
  severity: 'high' | 'medium' | 'low';
  likelyCause: string;
  confirmCommand: string;
  fixCapsule: string;
}> = [
  {
    pattern:
      /missing column|PrismaClientKnownRequestError|column .* does not exist/i,
    signature: 'PRISMA_SCHEMA_MISMATCH',
    severity: 'high',
    likelyCause:
      'Database schema is out of sync with Prisma schema — a migration is likely pending.',
    confirmCommand: 'npx prisma migrate status',
    fixCapsule: [
      'You are fixing a Prisma schema mismatch.',
      'Scope: 02_backend/prisma/ only.',
      'Steps: run "npx prisma migrate dev --name fix_schema", then verify with "npx prisma migrate status".',
      'Do NOT touch application code outside prisma/.',
      'Regression: run "npm run bot:sentinel" and confirm GO.',
    ].join(' '),
  },
  {
    pattern: /401|Unauthorized/,
    signature: 'AUTH_401_UNAUTHORIZED',
    severity: 'high',
    likelyCause:
      'Authentication token is missing, expired, or the demo user does not exist.',
    confirmCommand:
      'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3002/auth/login -X POST -H "Content-Type: application/json" -d \'{"email":"michael+demo@mw4h.com","password":"Passw0rd!"}\'',
    fixCapsule: [
      'You are fixing a 401 Unauthorized error.',
      'Scope: 02_backend/src/auth/ only.',
      'Allowed files: auth.module.ts, jwt.strategy.ts, auth.service.ts, auth.controller.ts.',
      'Check JWT strategy, token expiry, and that the demo user exists.',
      'Verify: POST /auth/login returns 200 + accessToken.',
      'Regression: run "npm run bot:sentinel" and confirm GO.',
    ].join(' '),
  },
  {
    pattern: /404.*route|Cannot (GET|POST|PUT|PATCH|DELETE)|route not found/i,
    signature: 'ROUTE_404_NOT_FOUND',
    severity: 'medium',
    likelyCause:
      'A frontend call hits an API path that the backend does not serve.',
    confirmCommand: 'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3002/<route>',
    fixCapsule: [
      'You are fixing a 404 route-not-found error.',
      'Scope: 02_backend/src/ controllers and modules.',
      'Allowed files: *.controller.ts, *.module.ts.',
      'Verify the controller exists and is registered in its module.',
      'Test: curl the route after fix and confirm 200.',
      'Regression: run "npm run bot:drift" and confirm GO.',
    ].join(' '),
  },
  {
    pattern: /CORS|Access-Control|proxy|ECONNREFUSED/i,
    signature: 'CORS_OR_PROXY_ERROR',
    severity: 'high',
    likelyCause:
      'Frontend cannot reach backend — CORS misconfiguration or proxy/rewrite broken.',
    confirmCommand: 'curl -v http://localhost:3000/api/customers 2>&1 | head -30',
    fixCapsule: [
      'You are fixing a CORS / proxy error.',
      'Scope: 03_frontend/next.config.* and 02_backend/src/main.ts.',
      'Allowed files: next.config.ts, next.config.js, main.ts.',
      'Check Next.js rewrites and NestJS enableCors().',
      'Verify: curl from frontend origin returns data, not a CORS error.',
      'Regression: run "npm run bot:sentinel" and confirm GO.',
    ].join(' '),
  },
  {
    pattern: /JSON.*parse|unexpected token|SyntaxError.*JSON/i,
    signature: 'JSON_PARSE_ERROR',
    severity: 'medium',
    likelyCause:
      'Backend returned non-JSON (HTML error page, empty body) where JSON was expected.',
    confirmCommand: 'curl -s http://127.0.0.1:3002/<endpoint> | head -5',
    fixCapsule: [
      'You are fixing a JSON parse error.',
      'The backend is returning HTML or an error page instead of JSON.',
      'Scope: 02_backend/src/ controllers and exception filters.',
      'Allowed files: *.controller.ts, *.service.ts, main.ts.',
      'Verify: curl the endpoint and confirm valid JSON response.',
      'Regression: run "npm run bot:sentinel" and confirm GO.',
    ].join(' '),
  },
];

const HIGH_SEVERITY_SIGS = new Set(
  SIGNATURES.filter((s) => s.severity === 'high').map((s) => s.signature),
);

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { mode: 'recommend', lines: 5000, hours: 24 };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case '--logFile':
        opts.logFile = next;
        i++;
        break;
      case '--mode':
        opts.mode = next;
        i++;
        break;
      case '--lines':
        opts.lines = Number(next);
        i++;
        break;
      case '--hours':
        opts.hours = Number(next);
        i++;
        break;
    }
  }
  return opts;
}

function discoverLogFiles(): string[] {
  const candidates: string[] = [];
  const searchDirs = [
    path.join(REPO_ROOT, '02_backend', 'logs'),
    path.join(REPO_ROOT, '02_backend', 'tmp'),
    path.join(REPO_ROOT, '03_frontend', 'logs'),
    path.join(REPO_ROOT, '03_frontend', '.next', 'server'),
  ];

  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  if (homeDir) {
    searchDirs.push(path.join(homeDir, '.pm2', 'logs'));
  }

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (
          e.isFile() &&
          (e.name.endsWith('.log') || e.name.includes('error'))
        ) {
          candidates.push(path.join(dir, e.name));
        }
      }
    } catch {
      /* skip inaccessible dirs */
    }
  }
  return candidates;
}

function extractErrorBlocks(content: string, maxBlocks: number = 3): string[] {
  const lines = content.split('\n');
  const blocks: string[] = [];
  let current: string[] = [];
  let inBlock = false;

  for (const line of lines) {
    const isError =
      /\b(ERROR|Error|FATAL|Exception|throw|reject|ECONNREFUSED)\b/.test(line);
    const isStack =
      /^\s+at\s/.test(line) || /^\s*(Caused by|Error:)/.test(line);

    if (isError) {
      if (inBlock && current.length > 0) {
        blocks.push(current.join('\n'));
        if (blocks.length >= maxBlocks) break;
      }
      current = [line];
      inBlock = true;
    } else if (inBlock && isStack) {
      current.push(line);
    } else if (inBlock && current.length > 0) {
      blocks.push(current.join('\n'));
      if (blocks.length >= maxBlocks) break;
      current = [];
      inBlock = false;
    }
  }

  if (inBlock && current.length > 0 && blocks.length < maxBlocks) {
    blocks.push(current.join('\n'));
  }

  return blocks;
}

function matchSignature(errorBlock: string): ErrorMatch | null {
  for (const sig of SIGNATURES) {
    if (sig.pattern.test(errorBlock)) {
      return {
        signature: sig.signature,
        excerpt: errorBlock.slice(0, 300),
        likelyCause: sig.likelyCause,
        confirmCommand: sig.confirmCommand,
        fixCapsulePrompt: sig.fixCapsule,
      };
    }
  }
  return null;
}

export async function run(opts?: Partial<CliOptions>): Promise<TriageReport> {
  const o: CliOptions = {
    mode: opts?.mode ?? 'recommend',
    logFile: opts?.logFile,
    lines: opts?.lines ?? 5000,
    hours: opts?.hours ?? 24,
  };

  let logContent = '';

  if (o.logFile) {
    if (fs.existsSync(o.logFile)) {
      logContent = fs.readFileSync(o.logFile, 'utf-8');
    }
  } else {
    const discovered = discoverLogFiles();
    for (const f of discovered) {
      try {
        logContent += fs.readFileSync(f, 'utf-8') + '\n';
      } catch {
        /* skip unreadable */
      }
    }
  }

  const errorBlocks = extractErrorBlocks(logContent, 3);
  const topErrors: ErrorMatch[] = [];

  for (const block of errorBlocks) {
    const matched = matchSignature(block);
    if (matched) {
      topErrors.push(matched);
    } else {
      topErrors.push({
        signature: 'UNKNOWN',
        excerpt: block.slice(0, 300),
        likelyCause:
          'Unrecognized error pattern; manual investigation required.',
        confirmCommand: 'Review the log file directly.',
        fixCapsulePrompt:
          'Unknown error detected. Review the excerpt and identify root cause manually. Scope: check recent changes in 02_backend/ and 03_frontend/.',
      });
    }
  }

  const hasHighSeverity = topErrors.some((e) =>
    HIGH_SEVERITY_SIGS.has(e.signature),
  );

  const report: TriageReport = {
    status: topErrors.length === 0 || !hasHighSeverity ? 'GO' : 'NO_GO',
    topErrors,
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'log-triage.json'),
    JSON.stringify(report, null, 2),
  );

  return report;
}

async function main(): Promise<void> {
  console.log('LOG TRIAGE + FIX CAPSULE LAUNCHER');
  console.log('-----------------------------------\n');

  const opts = parseArgs(process.argv);
  console.log(
    `Mode: ${opts.mode}${opts.logFile ? `  LogFile: ${opts.logFile}` : '  (auto-discover)'}\n`,
  );

  const report = await run(opts);

  if (report.topErrors.length === 0) {
    console.log('No error signatures found. All clear.');
  } else {
    console.log(`Top errors (${report.topErrors.length}):\n`);
    for (let i = 0; i < report.topErrors.length; i++) {
      const e = report.topErrors[i];
      console.log(`${i + 1}. [${e.signature}]`);
      console.log(`   Cause: ${e.likelyCause}`);
      console.log(`   Confirm: ${e.confirmCommand}`);
      console.log(`   Excerpt: ${e.excerpt.slice(0, 100)}...\n`);
    }
  }

  console.log(`Status: ${report.status}`);
  console.log(`Report: bots/reports/log-triage.json`);

  if (report.status === 'NO_GO') process.exit(1);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`Log Triage failed: ${err.message ?? err}`);
    process.exit(1);
  });
}
