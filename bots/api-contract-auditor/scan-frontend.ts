/**
 * API Contract Auditor — Frontend Scanner
 * Discovers API calls: fetch(), axios, apiFetch, '/api/...' paths
 */

import * as fs from 'fs';
import * as path from 'path';

export interface FrontendCall {
  path: string;
  method: string;
  sourceFile: string;
  line: number;
  raw: string;
}

const METHOD_PATTERNS = [
  { regex: /\bmethod:\s*['"](GET|POST|PATCH|PUT|DELETE)['"]/i, group: 1 },
  { regex: /\.(get|post|patch|put|delete)\s*\(\s*['"`]/i, group: 1 },
  { regex: /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g, method: 'GET' }, // default GET for fetch without method
];

const PATH_PATTERNS = [
  // fetch("http://localhost:3001/demo/trades") or fetch(API_BASE + path)
  /fetch\s*\(\s*['"`]?(https?:\/\/[^'"`\s]+|(?:\$\{API_BASE\}|\`\$\{API_BASE\})[^'"`]*|['"`]([^'"`]+)['"`])/g,
  // apiFetch("/orders") or apiFetch(`/orders/${id}`)
  /apiFetch\s*\(\s*['"`]([^'"`]+)['"`]|apiFetch\s*\(\s*`([^`]+)`/g,
  // axios.get("/api/...")
  /axios\.(?:get|post|patch|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
  // Standalone path strings that look like API paths
  /['"`](\/api\/[^'"`\s]+)['"`]/g,
  /['"`](https?:\/\/localhost:\d+\/[^'"`\s]+)['"`]/g,
];

function normalizePath(raw: string): string {
  let p = raw.trim();
  // Strip protocol and host
  p = p.replace(/^https?:\/\/[^/]+/, '');
  // Strip /api prefix (common proxy pattern)
  if (p.startsWith('/api/')) p = p.slice(4);
  if (!p.startsWith('/')) p = '/' + p;
  // Remove trailing slash
  p = p.replace(/\/$/, '') || '/';
  // Normalize to no leading slash for comparison
  return p.startsWith('/') ? p.slice(1) : p;
}

function extractMethodFromContext(line: string, _pathMatch: string): string {
  if (/method:\s*['"]POST['"]/i.test(line)) return 'POST';
  if (/method:\s*['"]PATCH['"]/i.test(line)) return 'PATCH';
  if (/method:\s*['"]PUT['"]/i.test(line)) return 'PUT';
  if (/method:\s*['"]DELETE['"]/i.test(line)) return 'DELETE';
  if (/\.post\s*\(/i.test(line)) return 'POST';
  if (/\.patch\s*\(/i.test(line)) return 'PATCH';
  if (/\.put\s*\(/i.test(line)) return 'PUT';
  if (/\.delete\s*\(/i.test(line)) return 'DELETE';
  return 'GET';
}

function extractMethodFromLines(lines: string[], startIdx: number): string {
  for (let i = startIdx; i < Math.min(startIdx + 6, lines.length); i++) {
    const m = lines[i].match(/method:\s*['"](GET|POST|PATCH|PUT|DELETE)['"]/i);
    if (m) return (m[1] || 'GET').toUpperCase();
  }
  return 'GET';
}

function extractPathsFromLine(
  line: string,
  filePath: string,
  lineNum: number,
  allLines?: string[]
): FrontendCall[] {
  const calls: FrontendCall[] = [];
  let pathRaw: string | null = null;

  // Skip apiFetch implementation - it's a wrapper, not a concrete call
  if (filePath.replace(/\\/g, '/').includes('lib/api.ts')) {
    const isWrapper = /fetch\s*\(\s*`\$\{API_BASE\}\$\{path\}`/.test(line);
    if (isWrapper) return calls;
  }

  // fetch("http://localhost:3001/demo/trades") or fetch('/api/auth/login', {...})
  const fetchMatch = line.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/);
  if (fetchMatch) {
    pathRaw = fetchMatch[1];
    const method =
      allLines && allLines.length > 0
        ? extractMethodFromLines(allLines, lineNum - 1)
        : extractMethodFromContext(line, pathRaw);
    calls.push({
      path: normalizePath(pathRaw),
      method,
      sourceFile: filePath,
      line: lineNum,
      raw: pathRaw,
    });
    return calls;
  }

  // fetch with template literal (but not the apiFetch wrapper)
  const fetchTemplate = line.match(/fetch\s*\(\s*`([^`]+)`/);
  if (fetchTemplate) {
    pathRaw = fetchTemplate[1];
    if (pathRaw.includes('${API_BASE}') && pathRaw.includes('${path}')) return calls;
    const basePath = pathRaw.replace(/\$\{[^}]+\}/g, ':id');
    const method =
      allLines && allLines.length > 0
        ? extractMethodFromLines(allLines, lineNum - 1)
        : extractMethodFromContext(line, pathRaw);
    calls.push({
      path: normalizePath(basePath),
      method,
      sourceFile: filePath,
      line: lineNum,
      raw: pathRaw,
    });
    return calls;
  }

  // fetch(API_BASE + path) - caller passes path variable; we can't resolve at scan time
  // Skip - this is the apiFetch wrapper pattern

  // apiFetch("/path")
  const apiFetchMatch = line.match(/apiFetch\s*\(\s*['"`]([^'"`]+)['"`]/);
  if (apiFetchMatch) {
    pathRaw = apiFetchMatch[1];
    calls.push({
      path: normalizePath(pathRaw),
      method: 'GET',
      sourceFile: filePath,
      line: lineNum,
      raw: pathRaw,
    });
    return calls;
  }

  // apiFetch(`/path/${id}`)
  const apiFetchTemplate = line.match(/apiFetch\s*\(\s*`([^`]+)`/);
  if (apiFetchTemplate) {
    pathRaw = apiFetchTemplate[1].replace(/\$\{[^}]+\}/g, ':id');
    calls.push({
      path: normalizePath(pathRaw),
      method: 'GET',
      sourceFile: filePath,
      line: lineNum,
      raw: apiFetchTemplate[1],
    });
    return calls;
  }

  // axios.get("/path")
  const axiosMatch = line.match(/axios\.(get|post|patch|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/i);
  if (axiosMatch) {
    const method = (axiosMatch[1] || 'get').toUpperCase();
    pathRaw = axiosMatch[2];
    calls.push({
      path: normalizePath(pathRaw),
      method,
      sourceFile: filePath,
      line: lineNum,
      raw: pathRaw,
    });
    return calls;
  }

  return calls;
}

function walkDir(dir: string, ext: string[], files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', '.next', 'dist'].includes(e.name)) {
        walkDir(full, ext, files);
      }
    } else if (ext.some((x) => e.name.endsWith(x))) {
      files.push(full);
    }
  }
  return files;
}

export function scanFrontend(frontendRoot: string): FrontendCall[] {
  const calls: FrontendCall[] = [];
  const files = walkDir(frontendRoot, ['.ts', '.tsx', '.js', '.jsx']);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const relPath = path.relative(frontendRoot, file);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const extracted = extractPathsFromLine(line, relPath, i + 1, lines);
      for (const c of extracted) {
        if (c.path && !c.path.startsWith('node_modules') && !c.path.includes('${')) {
          calls.push(c);
        }
      }
    }
  }

  return calls;
}
