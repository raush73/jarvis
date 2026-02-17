#!/usr/bin/env node
/**
 * Schema Drift Guardian — Entry Point
 * Compares Prisma schema to live database schemas across environments.
 */

import * as path from 'path';

import { compareSchemas } from './compare-schemas';
import {
  findPrismaSchemaPath,
  parsePrismaSchema,
} from './discover-prisma';
import { discoverDatabases } from './discover-databases';
import { generateReport, EnvironmentReport } from './generate-report';
import { introspectDatabaseSchema } from './introspect-db';

const REPO_ROOT = path.resolve(__dirname, '../../..', 'jarvis-backend');
const REPORTS_DIR = path.join(REPO_ROOT, 'reports');
const TMP_DIR = path.join(REPO_ROOT, 'bots', 'schema-drift-guardian', 'tmp');

async function main(): Promise<void> {
  console.log('SCHEMA DRIFT GUARDIAN');
  console.log('----------------------\n');

  const prismaSchemaPath = await findPrismaSchemaPath(REPO_ROOT);
  const prismaSchema = await parsePrismaSchema(prismaSchemaPath);

  const discovery = await discoverDatabases(REPO_ROOT);
  if (discovery.missing.length > 0) {
    throw new Error(
      `DATABASE_URL missing in ${discovery.missing.join(', ')}.`
    );
  }
  if (discovery.databases.length === 0) {
    throw new Error('DATABASE_URL cannot be resolved from .env files.');
  }

  console.log(
    `Prisma models discovered: ${Object.keys(prismaSchema.models).length}\n`
  );
  console.log('Environment checks:\n');

  const environmentReports: EnvironmentReport[] = [];

  for (const environment of discovery.databases) {
    const envLabel = environment.name.toUpperCase();
    const introspection = await introspectDatabaseSchema({
      environment,
      prismaSchemaPath,
      repoRoot: REPO_ROOT,
      tmpDir: TMP_DIR,
    });

    const drift = compareSchemas(prismaSchema, introspection.schema);
    environmentReports.push({ environment, drift });

    if (drift.findings.length === 0) {
      console.log(`${envLabel} → PASS`);
      continue;
    }

    console.log(`${envLabel} → DRIFT DETECTED`);
    for (const finding of drift.findings) {
      console.log(`  [${finding.severity}] ${finding.message}`);
    }
  }

  const reportPath = generateReport(environmentReports, REPORTS_DIR);
  console.log(`\nReport generated:\n${reportPath}\n`);

  const hasHighSeverity = environmentReports.some(
    (report) => report.drift.summary.high > 0
  );
  if (hasHighSeverity) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Schema Drift Guardian failed: ${message}`);
  process.exit(1);
});
