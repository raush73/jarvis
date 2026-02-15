import * as fs from 'fs';
import * as path from 'path';

import type { FingerprintWithStatus } from './detect-new-errors';
import type { LogSourceResult } from './ingest-logs';

export interface TriageReport {
  timestamp: string;
  since: string;
  sourceSummary: LogSourceResult[];
  topErrors: FingerprintWithStatus[];
  totalFingerprints: number;
  baselineCreated: boolean;
}

function ensureReportsDir(reportsDir: string): void {
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
}

export function generateReport(
  report: TriageReport,
  reportsDir: string
): string {
  ensureReportsDir(reportsDir);
  const reportPath = path.join(reportsDir, 'log-triage-report.md');

  const lines: string[] = [];
  lines.push('# Log Triage Report');
  lines.push('');
  lines.push(`Timestamp: ${report.timestamp}`);
  lines.push(`Time window start: ${report.since}`);
  lines.push('');

  lines.push('## Log Sources Scanned');
  for (const source of report.sourceSummary) {
    const okFiles = source.files.filter((file) => file.status === 'OK').length;
    lines.push(`- ${source.label} → ${source.status} (${okFiles} files)`);
  }
  lines.push('');

  if (report.baselineCreated) {
    lines.push('## Baseline Initialization');
    lines.push(
      '- baseline.json initialized from this run. Future runs will flag new fingerprints.'
    );
    lines.push('');
  }

  lines.push('## Top Error Fingerprints');
  if (report.topErrors.length === 0) {
    lines.push('*No error fingerprints found in the selected window.*');
    lines.push('');
  } else {
    lines.push(
      '| Rank | Error | Count | Severity | Status | Endpoint | Signature |'
    );
    lines.push('|------|-------|-------|----------|--------|----------|-----------|');
    report.topErrors.forEach((fingerprint, index) => {
      const endpoint = fingerprint.endpoint ?? '—';
      const signature = fingerprint.signature.replace(/\|/g, ' | ');
      lines.push(
        `| ${index + 1} | ${fingerprint.errorName} | ${fingerprint.count} | ${fingerprint.severity} | ${fingerprint.status} | ${endpoint} | ${signature} |`
      );
    });
    lines.push('');
  }

  const highRisk = report.topErrors.filter(
    (fingerprint) => fingerprint.severity === 'HIGH'
  );
  lines.push('## Highest Risk Issues');
  if (highRisk.length === 0) {
    lines.push('*No HIGH severity fingerprints in the top results.*');
  } else {
    for (const fingerprint of highRisk) {
      lines.push(
        `- ${fingerprint.errorName} (${fingerprint.count}) → ${fingerprint.status}`
      );
    }
  }
  lines.push('');

  lines.push('## Totals');
  lines.push(`- Fingerprints analyzed: ${report.totalFingerprints}`);
  lines.push(`- Top errors listed: ${report.topErrors.length}`);
  lines.push('');

  fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');
  return reportPath;
}
