#!/usr/bin/env node
/**
 * Env / Infra Sentinel — Entry Point
 * Read-only runtime inspection for Jarvis infra.
 */
import { execSync } from 'child_process';
import * as path from 'path';

import { checkBackendHealth } from './check-backend-health';
import { checkEnvIdentity } from './check-env-identity';
import { checkListeners } from './check-listeners';
import { checkPm2, ExpectedService } from './check-pm2';
import { checkNginxStatus, checkProxyRouting } from './check-proxy';
import { generateReport, ReportSection } from './generate-report';

const REPO_ROOT = path.resolve(__dirname, '../..');
const REPORTS_DIR = path.join(REPO_ROOT, 'reports');

const EXPECTED_SERVICES: ExpectedService[] = [
  { name: 'backend-prod', role: 'backend', port: 3000 },
  { name: 'frontend', role: 'frontend', port: 3001 },
  { name: 'backend-training', role: 'backend', port: 3002 },
];

function ensureCommandAvailable(command: string, reason: string): void {
  try {
    execSync(`command -v ${command}`, { stdio: 'pipe' });
  } catch {
    throw new Error(`STOP: ${reason}`);
  }
}

function printSection(title: string, items: { label: string; status: string }[]) {
  console.log(`${title}:`);
  for (const item of items) {
    console.log(`${item.label} → ${item.status}`);
  }
  console.log('');
}

async function main(): Promise<void> {
  console.log('INFRA SENTINEL');
  console.log('----------------\n');

  ensureCommandAvailable('ss', 'ss command unavailable');
  ensureCommandAvailable('pm2', 'pm2 not installed');
  ensureCommandAvailable('curl', 'curl not installed');
  ensureCommandAvailable('nginx', 'nginx not accessible');

  const expectedPorts = EXPECTED_SERVICES.map((service) => service.port).filter(
    (port): port is number => typeof port === 'number'
  );

  const listeners = checkListeners(expectedPorts);
  const pm2 = checkPm2(EXPECTED_SERVICES);
  const proxy = checkProxyRouting();
  const backendHealth = checkBackendHealth();

  if (backendHealth.missingEndpoints.length > 0) {
    throw new Error(
      `STOP: Backend health endpoints missing (${backendHealth.missingEndpoints.join(
        ', '
      )})`
    );
  }

  const envIdentity = checkEnvIdentity(pm2.processes, EXPECTED_SERVICES);
  const nginxStatus = checkNginxStatus();

  printSection('Port listeners', listeners.items);
  printSection('PM2 services', pm2.items);
  printSection('Proxy routing', proxy.items);
  printSection('Backend health', backendHealth.items);
  printSection('Env identity', envIdentity.items);
  printSection('Nginx status', nginxStatus.items);

  const sections: ReportSection[] = [
    { title: 'Listener status', items: listeners.items },
    { title: 'PM2 status', items: pm2.items },
    { title: 'Proxy routing results', items: proxy.items },
    { title: 'Backend health results', items: backendHealth.items },
    { title: 'Env identity verification', items: envIdentity.items },
    { title: 'Nginx status', items: nginxStatus.items },
  ];

  const reportPath = generateReport(
    {
      timestamp: new Date().toISOString(),
      sections,
      blockers: [],
    },
    REPORTS_DIR
  );

  console.log(`Report generated:\n${reportPath}\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Infra Sentinel failed: ${message}`);
  process.exit(1);
});
