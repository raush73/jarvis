#!/usr/bin/env node
/**
 * Log Triage Bot — Entry Point
 * Read-only runtime log analysis for Jarvis.
 */
import * as os from 'os';
import * as path from 'path';

import { classifySeverity } from './classify-severity';
import { loadBaseline, markNewErrors, saveBaseline } from './detect-new-errors';
import { fingerprintErrors } from './fingerprint-errors';
import { generateReport } from './generate-report';
import { ingestLogs, LogSourceConfig } from './ingest-logs';

const REPO_ROOT = path.resolve(__dirname, '../..');
const REPORTS_DIR = path.join(REPO_ROOT, 'reports');
const BASELINE_PATH = path.join(REPO_ROOT, 'bots', 'log-triage', 'baseline.json');

const DEFAULT_LINES = 5000;
const DEFAULT_HOURS = 24;

interface CliOptions {
  lines: number;
  hours?: number;
  since?: Date;
  updateBaseline: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    lines: DEFAULT_LINES,
    hours: DEFAULT_HOURS,
    updateBaseline: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--lines' || arg === '--tail') {
      if (!next) throw new Error('Missing value for --lines');
      options.lines = Number(next);
      i += 1;
      continue;
    }

    if (arg === '--hours') {
      if (!next) throw new Error('Missing value for --hours');
      options.hours = Number(next);
      i += 1;
      continue;
    }

    if (arg === '--since') {
      if (!next) throw new Error('Missing value for --since');
      const parsed = new Date(next);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid --since value: ${next}`);
      }
      options.since = parsed;
      options.hours = undefined;
      i += 1;
      continue;
    }

    if (arg === '--update-baseline') {
      options.updateBaseline = true;
      continue;
    }
  }

  if (!Number.isFinite(options.lines) || options.lines <= 0) {
    throw new Error('Invalid --lines value');
  }
  if (options.hours !== undefined) {
    if (!Number.isFinite(options.hours) || options.hours <= 0) {
      throw new Error('Invalid --hours value');
    }
  }

  return options;
}

function computeSince(
  baselineLastRun: string | null,
  options: CliOptions
): Date {
  if (options.since) return options.since;
  if (baselineLastRun) {
    const parsed = new Date(baselineLastRun);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const hours = options.hours ?? DEFAULT_HOURS;
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function buildDefaultSources(): LogSourceConfig[] {
  const pm2LogDir = path.join(os.homedir(), '.pm2', 'logs');
  const pm2Logs = [
    'backend-prod-error.log',
    'backend-training-error.log',
    'frontend-error.log',
  ].map((name) => path.join(pm2LogDir, name));

  return [
    { label: 'PM2', paths: pm2Logs },
    { label: 'NGINX', paths: ['/var/log/nginx/error.log'] },
    { label: 'APP', paths: ['/opt/jarvis/logs'] },
  ];
}

async function main(): Promise<void> {
  console.log('LOG TRIAGE REPORT');
  console.log('-------------------\n');

  const options = parseArgs(process.argv);
  const baselineState = loadBaseline(BASELINE_PATH);
  const since = computeSince(baselineState.file.lastRunAt, options);

  const { entries, sources } = ingestLogs(buildDefaultSources(), {
    maxLines: options.lines,
    since,
  });

  const fingerprints = fingerprintErrors(entries);
  const withSeverity = fingerprints.map((fingerprint) => ({
    ...fingerprint,
    severity: classifySeverity(fingerprint),
  }));

  const { fingerprints: withStatus, baseline, baselineCreated } = markNewErrors(
    withSeverity,
    baselineState,
    { updateBaseline: options.updateBaseline }
  );
  saveBaseline(baseline, BASELINE_PATH);

  const topErrors = [...withStatus]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  console.log(`Logs scanned (time window start: ${since.toISOString()}):`);
  for (const source of sources) {
    console.log(`${source.label} → ${source.status}`);
  }
  console.log('');

  if (topErrors.length === 0) {
    console.log('Top errors:');
    console.log('No error fingerprints found in the selected window.\n');
  } else {
    console.log('Top errors:\n');
    topErrors.forEach((fingerprint, index) => {
      console.log(`${index + 1}️⃣ ${fingerprint.errorName}`);
      console.log(`Occurrences: ${fingerprint.count}`);
      console.log(`Severity: ${fingerprint.severity}`);
      console.log(`Status: ${fingerprint.status}\n`);
    });
  }

  const reportPath = generateReport(
    {
      timestamp: new Date().toISOString(),
      since: since.toISOString(),
      sourceSummary: sources,
      topErrors,
      totalFingerprints: withStatus.length,
      baselineCreated,
    },
    REPORTS_DIR
  );

  console.log(`Report generated:\n${reportPath}\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Log Triage Bot failed: ${message}`);
  process.exit(1);
});
