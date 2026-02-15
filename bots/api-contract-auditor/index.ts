#!/usr/bin/env node
/**
 * API Contract Auditor — Entry Point
 * Scans frontend API calls vs backend routes, generates coverage report.
 */

import * as path from 'path';
import { scanFrontend } from './scan-frontend';
import { scanBackend } from './scan-backend';
import { compareContracts } from './compare-contracts';
import { generateReport } from './generate-report';

const REPO_ROOT = path.resolve(__dirname, '../..');
const FRONTEND_ROOT = path.join(REPO_ROOT, '03_frontend');
const BACKEND_ROOT = path.join(REPO_ROOT, '02_backend');
const REPORTS_DIR = path.join(REPO_ROOT, 'reports');

function main(): void {
  console.log('API CONTRACT AUDIT');
  console.log('-------------------\n');

  const frontendCalls = scanFrontend(FRONTEND_ROOT);
  const backendRoutes = scanBackend(BACKEND_ROOT);

  const result = compareContracts(frontendCalls, backendRoutes);

  const matchedCount = result.matched.filter((m) => m.methodMatch).length;

  console.log(`Frontend calls discovered: ${result.frontendCalls.length}`);
  console.log(`Backend routes discovered: ${result.backendRoutes.length}`);
  console.log(`Matched: ${matchedCount}`);
  console.log(`Missing: ${result.missingBackend.length}`);
  console.log(`Coverage: ${result.coveragePercent}%\n`);

  const reportPath = generateReport(result, REPORTS_DIR);
  console.log(`Report generated:\n${reportPath}\n`);

  if (result.missingBackend.length > 0) {
    process.exit(1);
  }
}

main();
