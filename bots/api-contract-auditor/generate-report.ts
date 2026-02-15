/**
 * API Contract Auditor — Report Generator
 * Writes reports/api-contract-report.md
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AuditResult } from './compare-contracts';
import type { FrontendCall } from './scan-frontend';

function ensureReportsDir(reportsDir: string): void {
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
}

function groupByModule(items: FrontendCall[]): Map<string, FrontendCall[]> {
  const byModule = new Map<string, FrontendCall[]>();
  for (const item of items) {
    const module = item.sourceFile.split('/')[0] || 'unknown';
    if (!byModule.has(module)) byModule.set(module, []);
    byModule.get(module)!.push(item);
  }
  return byModule;
}

export function generateReport(result: AuditResult, reportsDir: string): string {
  ensureReportsDir(reportsDir);
  const reportPath = path.join(reportsDir, 'api-contract-report.md');

  const timestamp = new Date().toISOString();
  const matchedCount = result.matched.filter((m) => m.methodMatch).length;
  const totalCalls = result.frontendCalls.length;

  let md = `# API Contract Audit Report

**Generated:** ${timestamp}

---

## Summary

| Metric | Count |
|--------|-------|
| Frontend calls discovered | ${totalCalls} |
| Backend routes discovered | ${result.backendRoutes.length} |
| Matched (path + method) | ${matchedCount} |
| Missing backend | ${result.missingBackend.length} |
| Method mismatches | ${result.methodMismatches.length} |
| **Coverage** | **${result.coveragePercent}%** |

---

`;

  if (result.missingBackend.length > 0) {
    md += `## Missing Backend Endpoints

Frontend calls with no matching backend route:

| Path | Method | Source |
|------|--------|--------|
`;
    for (const m of result.missingBackend) {
      md += `| \`${m.path}\` | ${m.method} | \`${m.sourceFile}:${m.line}\` |\n`;
    }
    md += '\n---\n\n';
  }

  if (result.methodMismatches.length > 0) {
    md += `## Method Mismatches

Frontend and backend paths match but HTTP methods differ:

| Frontend | Backend | Frontend Method | Backend Method |
|----------|---------|-----------------|----------------|
`;
    for (const m of result.methodMismatches) {
      md += `| \`${m.frontend.path}\` | \`${m.backend.fullPath}\` | ${m.frontend.method} | ${m.backend.method} |\n`;
    }
    md += '\n---\n\n';
  }

  md += `## Wiring Backlog (by module/screen)

Grouped by frontend source module for prioritization:

`;
  const byModule = groupByModule(result.missingBackend);
  if (byModule.size === 0) {
    md += '*No missing endpoints — all frontend calls have backend coverage.*\n';
  } else {
    for (const [module, items] of byModule) {
      md += `### ${module}\n\n`;
      for (const item of items) {
        md += `- **\`${item.path}\`** (${item.method}) — \`${item.sourceFile}:${item.line}\`\n`;
      }
      md += '\n';
    }
  }

  md += `---

## Matched Endpoints

| Frontend Path | Backend Route | Method |
|---------------|---------------|--------|
`;
  for (const m of result.matched) {
    md += `| \`${m.frontend.path}\` | \`${m.backend.fullPath}\` | ${m.backend.method} |\n`;
  }

  fs.writeFileSync(reportPath, md, 'utf-8');
  return reportPath;
}
