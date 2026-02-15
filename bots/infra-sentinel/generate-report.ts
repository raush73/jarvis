import * as fs from 'fs';
import * as path from 'path';

export type Status = 'PASS' | 'FAIL' | 'WARN';
export type Severity = 'HIGH' | 'MED' | 'LOW';

export interface ReportItem {
  label: string;
  status: Status;
  severity: Severity;
  details?: string;
}

export interface ReportSection {
  title: string;
  items: ReportItem[];
}

export interface SentinelReport {
  timestamp: string;
  sections: ReportSection[];
  blockers: string[];
}

export function generateReport(
  report: SentinelReport,
  reportsDir: string
): string {
  const lines: string[] = [];
  lines.push('# Infra Sentinel Report');
  lines.push('');
  lines.push(`Timestamp: ${report.timestamp}`);
  lines.push('');

  if (report.blockers.length > 0) {
    lines.push('## Blockers');
    for (const blocker of report.blockers) {
      lines.push(`- ${blocker}`);
    }
    lines.push('');
  }

  for (const section of report.sections) {
    lines.push(`## ${section.title}`);
    for (const item of section.items) {
      const details = item.details ? ` — ${item.details}` : '';
      lines.push(`- ${item.label} → ${item.status} (${item.severity})${details}`);
    }
    lines.push('');
  }

  const severityTotals: Record<Severity, number> = {
    HIGH: 0,
    MED: 0,
    LOW: 0,
  };

  for (const section of report.sections) {
    for (const item of section.items) {
      severityTotals[item.severity] += 1;
    }
  }

  lines.push('## Severity Summary');
  lines.push(`- HIGH: ${severityTotals.HIGH}`);
  lines.push(`- MED: ${severityTotals.MED}`);
  lines.push(`- LOW: ${severityTotals.LOW}`);
  lines.push('');
  lines.push('## Severity Classification');
  lines.push('- HIGH → deployment failure risk');
  lines.push('- MED → misconfiguration risk');
  lines.push('- LOW → advisory');
  lines.push('');

  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, 'infra-sentinel-report.md');
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');
  return reportPath;
}
