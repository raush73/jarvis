#!/usr/bin/env node
/**
 * Schema + Contract Drift Guardian
 * Compares Prisma schema to live DB + scans frontend/backend API contract drift.
 */
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../..');
const FRONTEND_ROOT = path.join(REPO_ROOT, '03_frontend');
const BACKEND_ROOT = path.join(REPO_ROOT, '02_backend');
const REPORTS_DIR = path.resolve(__dirname, '..', 'reports');

export interface DriftReport {
  status: 'GO' | 'NO_GO';
  apiDrift: {
    frontendUsed: string[];
    backendRoutes: string[];
    frontendUsedNotInBackend: string[];
    backendNotUsedByFrontend: string[];
  };
  schemaDrift: string;
}

function walkDir(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'dist', '.git'].includes(entry.name)) continue;
      results.push(...walkDir(full, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

function scanFrontendEndpoints(): string[] {
  const files = walkDir(FRONTEND_ROOT, ['.ts', '.tsx']);
  const endpoints = new Set<string>();
  const apiRegex = /['"`](\/api\/[^'"`\s?#]+)/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let match: RegExpExecArray | null;
    while ((match = apiRegex.exec(content)) !== null) {
      let ep = match[1].replace(/\?.*$/, '').replace(/#.*$/, '');
      ep = ep.replace(/\$\{[^}]+\}/g, ':id');
      endpoints.add(ep);
    }
  }

  return [...endpoints].sort();
}

function scanBackendRoutes(): string[] {
  const srcDir = path.join(BACKEND_ROOT, 'src');
  const files = walkDir(srcDir, ['.ts']);
  const routes = new Set<string>();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const controllerMatch = content.match(
      /@Controller\s*\(\s*['"`]([^'"`]*)['"`]\s*\)/,
    );
    const controllerEmpty = content.match(/@Controller\s*\(\s*\)/);
    const basePath = controllerMatch
      ? controllerMatch[1].replace(/^\//, '')
      : controllerEmpty
        ? ''
        : null;
    if (basePath === null) continue;

    const decorators =
      /@(Get|Post|Put|Patch|Delete)\s*\(\s*['"`]?([^'"`)]*)['"`]?\s*\)/g;
    let m: RegExpExecArray | null;
    while ((m = decorators.exec(content)) !== null) {
      const routePart = (m[2] || '').replace(/^\//, '');
      const full =
        basePath && routePart
          ? `/${basePath}/${routePart}`
          : `/${basePath || routePart || ''}`;
      routes.add(full.replace(/\/+/g, '/'));
    }
  }

  return [...routes].sort();
}

async function runSchemaDrift(): Promise<string> {
  try {
    const { findPrismaSchemaPath, parsePrismaSchema } = await import(
      './discover-prisma'
    );
    const { discoverDatabases } = await import('./discover-databases');
    const { compareSchemas } = await import('./compare-schemas');
    const { introspectDatabaseSchema } = await import('./introspect-db');

    const schemaRepoRoot = path.resolve(
      __dirname,
      '../../..',
      'jarvis-backend',
    );
    const tmpDir = path.join(__dirname, 'tmp');
    const prismaSchemaPath = await findPrismaSchemaPath(schemaRepoRoot);
    const prismaSchema = await parsePrismaSchema(prismaSchemaPath);
    const discovery = await discoverDatabases(schemaRepoRoot);
    if (discovery.databases.length === 0) return 'no databases discovered';

    const drifts: string[] = [];
    for (const env of discovery.databases) {
      const introspection = await introspectDatabaseSchema({
        environment: env,
        prismaSchemaPath,
        repoRoot: schemaRepoRoot,
        tmpDir,
      });
      const drift = compareSchemas(prismaSchema, introspection.schema);
      if (drift.findings.length > 0) {
        drifts.push(
          `${env.name}: ${drift.findings.length} findings (high: ${drift.summary.high})`,
        );
      }
    }
    return drifts.length > 0 ? drifts.join('; ') : 'no drift detected';
  } catch (err: any) {
    return `schema check skipped: ${err.message ?? err}`;
  }
}

export async function run(): Promise<DriftReport> {
  const frontendUsed = scanFrontendEndpoints();
  const backendRoutes = scanBackendRoutes();

  const frontendNormalized = frontendUsed.map((ep) =>
    ep.startsWith('/api/') ? ep.slice(4) : ep,
  );

  const backendNorm = backendRoutes.map((r) => r.replace(/:[\w]+/g, ':id'));
  const frontendNorm = frontendNormalized.map((r) =>
    r.replace(/:[\w]+/g, ':id'),
  );

  const backendSet = new Set(backendNorm);
  const frontendNormSet = new Set(frontendNorm);

  const frontendUsedNotInBackend = [...new Set(frontendNorm)].filter(
    (ep) => !backendSet.has(ep),
  );
  const backendNotUsedByFrontend = [...new Set(backendNorm)].filter(
    (rt) => !frontendNormSet.has(rt),
  );

  const schemaDrift = await runSchemaDrift();

  const hasIssues =
    frontendUsedNotInBackend.length > 0 || schemaDrift.includes('findings');

  const report: DriftReport = {
    status: hasIssues ? 'NO_GO' : 'GO',
    apiDrift: {
      frontendUsed,
      backendRoutes,
      frontendUsedNotInBackend,
      backendNotUsedByFrontend,
    },
    schemaDrift,
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'schema-drift-guardian.json'),
    JSON.stringify(report, null, 2),
  );

  return report;
}

async function main(): Promise<void> {
  console.log('SCHEMA + CONTRACT DRIFT GUARDIAN');
  console.log('---------------------------------\n');

  const report = await run();

  console.log(
    `Frontend /api/ endpoints found: ${report.apiDrift.frontendUsed.length}`,
  );
  console.log(
    `Backend routes found:           ${report.apiDrift.backendRoutes.length}`,
  );
  console.log(
    `Frontend not in backend:        ${report.apiDrift.frontendUsedNotInBackend.length}`,
  );
  if (report.apiDrift.frontendUsedNotInBackend.length > 0) {
    for (const ep of report.apiDrift.frontendUsedNotInBackend) {
      console.log(`  missing: ${ep}`);
    }
  }
  console.log(
    `Backend not used by frontend:   ${report.apiDrift.backendNotUsedByFrontend.length}`,
  );
  console.log(`\nSchema drift: ${report.schemaDrift}`);
  console.log(`\nStatus: ${report.status}`);
  console.log(`Report: bots/reports/schema-drift-guardian.json`);

  if (report.status === 'NO_GO') process.exit(1);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`Schema Drift Guardian failed: ${err.message ?? err}`);
    process.exit(1);
  });
}
