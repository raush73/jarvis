/**
 * API Contract Auditor — Backend Scanner
 * Discovers NestJS routes: @Controller, @Get, @Post, @Patch, @Delete
 */

import * as fs from 'fs';
import * as path from 'path';

export interface BackendRoute {
  path: string;
  method: string;
  sourceFile: string;
  line: number;
  fullPath: string; // controller path + route path
}

function walkDir(dir: string, ext: string[], files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', 'dist'].includes(e.name)) {
        walkDir(full, ext, files);
      }
    } else if (ext.some((x) => e.name.endsWith(x))) {
      files.push(full);
    }
  }
  return files;
}

function normalizeRoutePath(p: string): string {
  let s = p.trim();
  if (s.startsWith('/')) s = s.slice(1);
  s = s.replace(/\/$/, '') || '';
  return s;
}

function joinPaths(base: string, route: string): string {
  const b = normalizeRoutePath(base);
  const r = normalizeRoutePath(route);
  if (!b) return r || '/';
  if (!r) return b;
  return `${b}/${r}`.replace(/\/+/g, '/');
}

export function scanBackend(backendRoot: string): BackendRoute[] {
  const routes: BackendRoute[] = [];
  const srcDir = path.join(backendRoot, 'src');
  const files = walkDir(srcDir, ['.ts']);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const relPath = path.relative(backendRoot, file);

    // Extract @Controller('path') or @Controller("path")
    const controllerMatch = content.match(/@Controller\s*\(\s*['"`]([^'"`]*)['"`]\s*\)/);
    const controllerPath = controllerMatch ? controllerMatch[1].trim() : '';

    // @Controller() with no path = root
    const controllerEmpty = content.match(/@Controller\s*\(\s*\)/);

    const basePath = controllerPath || (controllerEmpty ? '' : null);
    if (basePath === null && !controllerMatch && !controllerEmpty) continue;

    const lines = content.split('\n');
    let currentRoutePath = '';
    let currentMethod = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // @Get(), @Get('path'), @Get(':id')
      const getMatch = line.match(/@Get\s*\(\s*['"`]?([^'"`)]*)['"`]?\s*\)/);
      if (getMatch) {
        currentMethod = 'GET';
        currentRoutePath = getMatch[1]?.trim() || '';
        const full = joinPaths(basePath || '', currentRoutePath);
        routes.push({
          path: currentRoutePath,
          method: 'GET',
          sourceFile: relPath,
          line: i + 1,
          fullPath: full,
        });
        continue;
      }

      const postMatch = line.match(/@Post\s*\(\s*['"`]?([^'"`)]*)['"`]?\s*\)/);
      if (postMatch) {
        currentMethod = 'POST';
        currentRoutePath = postMatch[1]?.trim() || '';
        const full = joinPaths(basePath || '', currentRoutePath);
        routes.push({
          path: currentRoutePath,
          method: 'POST',
          sourceFile: relPath,
          line: i + 1,
          fullPath: full,
        });
        continue;
      }

      const patchMatch = line.match(/@Patch\s*\(\s*['"`]?([^'"`)]*)['"`]?\s*\)/);
      if (patchMatch) {
        currentMethod = 'PATCH';
        currentRoutePath = patchMatch[1]?.trim() || '';
        const full = joinPaths(basePath || '', currentRoutePath);
        routes.push({
          path: currentRoutePath,
          method: 'PATCH',
          sourceFile: relPath,
          line: i + 1,
          fullPath: full,
        });
        continue;
      }

      const putMatch = line.match(/@Put\s*\(\s*['"`]?([^'"`)]*)['"`]?\s*\)/);
      if (putMatch) {
        currentMethod = 'PUT';
        currentRoutePath = putMatch[1]?.trim() || '';
        const full = joinPaths(basePath || '', currentRoutePath);
        routes.push({
          path: currentRoutePath,
          method: 'PUT',
          sourceFile: relPath,
          line: i + 1,
          fullPath: full,
        });
        continue;
      }

      const deleteMatch = line.match(/@Delete\s*\(\s*['"`]?([^'"`)]*)['"`]?\s*\)/);
      if (deleteMatch) {
        currentMethod = 'DELETE';
        currentRoutePath = deleteMatch[1]?.trim() || '';
        const full = joinPaths(basePath || '', currentRoutePath);
        routes.push({
          path: currentRoutePath,
          method: 'DELETE',
          sourceFile: relPath,
          line: i + 1,
          fullPath: full,
        });
      }
    }
  }

  return routes;
}
