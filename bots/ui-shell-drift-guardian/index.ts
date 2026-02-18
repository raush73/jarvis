#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../..');
const FRONTEND_ROOT = path.join(REPO_ROOT, '03_frontend');

const IGNORE_DIRS = new Set(['node_modules', '.next', 'dist']);
const EXTENSIONS = new Set(['.ts', '.tsx']);

const PATTERNS: string[] = [
  'UI shell (mocked)',
  'logged-out demo mode',
];

interface Finding {
  file: string;
  line: number;
  pattern: string;
  text: string;
}

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

function scan(files: string[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      for (const pattern of PATTERNS) {
        if (lower.includes(pattern.toLowerCase())) {
          findings.push({
            file: path.relative(REPO_ROOT, file),
            line: i + 1,
            pattern,
            text: lines[i].trim(),
          });
        }
      }
    }
  }
  return findings;
}

function main(): void {
  console.log('========================================');
  console.log(' UI SHELL DRIFT GUARDIAN — REPORT');
  console.log('========================================\n');

  if (!fs.existsSync(FRONTEND_ROOT)) {
    console.error(`Frontend directory not found: ${FRONTEND_ROOT}`);
    process.exit(1);
  }

  const files = walk(FRONTEND_ROOT);
  const findings = scan(files);

  console.log(`Files scanned:  ${files.length}`);
  console.log(`Findings:       ${findings.length}\n`);

  if (findings.length === 0) {
    console.log('Status: CLEAN — no shell drift detected.\n');
    process.exit(0);
  }

  console.log('--- HITS ---\n');
  for (const f of findings) {
    console.log(`  ${f.file}:${f.line}`);
    console.log(`    Pattern: "${f.pattern}"`);
    console.log(`    Line:    ${f.text}\n`);
  }

  const uniqueFiles = [...new Set(findings.map((f) => f.file))];
  console.log(`Affected files (${uniqueFiles.length}):`);
  for (const uf of uniqueFiles) {
    console.log(`  - ${uf}`);
  }

  console.log('\nStatus: DRIFT DETECTED — resolve before claiming wired.\n');
  process.exit(1);
}

main();
