import * as fs from 'fs';
import * as path from 'path';

import { DriftFinding, DriftResult } from './compare-schemas';
import { DiscoveredDatabase } from './discover-databases';

export type EnvironmentReport = {
  environment: DiscoveredDatabase;
  drift: DriftResult;
};

export function generateReport(
  results: EnvironmentReport[],
  reportsDir: string
): string {
  const timestamp = new Date().toISOString();
  const lines: string[] = [];

  lines.push('# Schema Drift Report');
  lines.push('');
  lines.push(`Generated: ${timestamp}`);
  lines.push('');

  const passCount = results.filter((result) => result.drift.findings.length === 0)
    .length;
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Environments scanned: ${results.length}`);
  lines.push(`- PASS: ${passCount}`);
  lines.push(`- DRIFT DETECTED: ${results.length - passCount}`);
  lines.push('');

  for (const result of results) {
    const envName = result.environment.name.toUpperCase();
    const status =
      result.drift.findings.length === 0 ? 'PASS' : 'DRIFT DETECTED';

    lines.push(`## Environment: ${envName}`);
    lines.push('');
    lines.push(`- Status: ${status}`);
    lines.push(`- DB identity: ${result.environment.maskedIdentity}`);
    lines.push(`- Source env: ${path.basename(result.environment.envFile)}`);
    lines.push('');

    if (result.drift.findings.length === 0) {
      lines.push('No drift detected.');
      lines.push('');
      continue;
    }

    lines.push('### Findings');
    lines.push('');
    lines.push(...formatFindings(result.drift.findings));
    lines.push('');
  }

  lines.push('## Severity Guide');
  lines.push('');
  lines.push('- HIGH: runtime break risk');
  lines.push('- MED: potential mismatch');
  lines.push('- LOW: extra/unmapped fields');
  lines.push('');

  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, 'schema-drift-report.md');
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');

  return reportPath;
}

function formatFindings(findings: DriftFinding[]): string[] {
  return findings.map((finding) => `- [${finding.severity}] ${finding.message}`);
}
