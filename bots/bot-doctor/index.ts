#!/usr/bin/env node
/**
 * Bot Doctor — Conductor
 * Runs sentinel, drift, and triage bots in sequence; prints GO/NO-GO.
 */
import * as fs from 'fs';
import * as path from 'path';

import type { SentinelReport } from '../infra-sentinel/index';
import type { DriftReport } from '../schema-drift-guardian/index';
import type { TriageReport } from '../log-triage/index';

const REPORTS_DIR = path.resolve(__dirname, '..', 'reports');

interface DoctorReport {
  status: 'GO' | 'NO_GO';
  sentinel: SentinelReport;
  drift: DriftReport;
  triage: TriageReport;
  nextAction: string;
}

function writeReport(report: DoctorReport): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'bot-doctor.json'),
    JSON.stringify(report, null, 2),
  );
}

function emptyDrift(): DriftReport {
  return {
    status: 'GO',
    apiDrift: {
      frontendUsed: [],
      backendRoutes: [],
      frontendUsedNotInBackend: [],
      backendNotUsedByFrontend: [],
    },
    schemaDrift: 'skipped',
  };
}

function emptyTriage(): TriageReport {
  return { status: 'GO', topErrors: [] };
}

async function main(): Promise<void> {
  console.log('BOT DOCTOR — Aggregate Health Check');
  console.log('=====================================\n');

  // Dynamic imports avoid triggering side-effects at module load time
  const { run: runSentinel } = await import('../infra-sentinel/index');
  const { run: runDrift } = await import('../schema-drift-guardian/index');
  const { run: runTriage } = await import('../log-triage/index');

  // Step 1: Infra Sentinel
  console.log('>>> Running Infra Sentinel...');
  let sentinel: SentinelReport;
  try {
    sentinel = await runSentinel();
  } catch (err: any) {
    console.error(`  Sentinel crashed: ${err.message}`);
    process.exit(1);
    return; // unreachable, satisfies TS
  }
  console.log(`    Result: ${sentinel.status}\n`);

  if (sentinel.status === 'NO_GO') {
    const first = sentinel.failures[0];
    const nextAction =
      first?.next_step || 'Fix sentinel failures before proceeding.';
    console.log('NO-GO — Sentinel failed.');
    console.log(`Next action: ${nextAction}`);
    writeReport({
      status: 'NO_GO',
      sentinel,
      drift: emptyDrift(),
      triage: emptyTriage(),
      nextAction,
    });
    process.exit(1);
  }

  // Step 2: Schema + Contract Drift
  console.log('>>> Running Schema + Contract Drift...');
  let drift: DriftReport;
  try {
    drift = await runDrift();
  } catch (err: any) {
    console.error(`  Drift check crashed: ${err.message}`);
    process.exit(1);
    return;
  }
  console.log(`    Result: ${drift.status}\n`);

  if (drift.status === 'NO_GO') {
    const topIssue =
      drift.apiDrift.frontendUsedNotInBackend[0] ||
      drift.schemaDrift ||
      'API contract mismatch detected.';
    const nextAction = `Fix API drift: ${topIssue}`;
    console.log('NO-GO — Drift detected.');
    console.log(`Next action: ${nextAction}`);
    writeReport({
      status: 'NO_GO',
      sentinel,
      drift,
      triage: emptyTriage(),
      nextAction,
    });
    process.exit(1);
  }

  // Step 3: Log Triage
  console.log('>>> Running Log Triage...');
  let triage: TriageReport;
  try {
    triage = await runTriage();
  } catch (err: any) {
    console.error(`  Triage crashed: ${err.message}`);
    process.exit(1);
    return;
  }
  console.log(`    Result: ${triage.status}\n`);

  const nextAction =
    triage.status === 'NO_GO'
      ? `Address top log error: ${triage.topErrors[0]?.signature ?? 'unknown'}`
      : 'All checks passed. Safe to proceed.';

  const report: DoctorReport = {
    status: triage.status === 'NO_GO' ? 'NO_GO' : 'GO',
    sentinel,
    drift,
    triage,
    nextAction,
  };

  writeReport(report);

  console.log(`=== VERDICT: ${report.status} ===`);
  console.log(`Next action: ${report.nextAction}`);
  console.log(`Report: bots/reports/bot-doctor.json`);

  if (report.status === 'NO_GO') process.exit(1);
}

main().catch((err) => {
  console.error(`Bot Doctor failed: ${err.message ?? err}`);
  process.exit(1);
});
