import * as fs from 'fs';
import * as path from 'path';

export type DiscoveredDatabase = {
  name: string;
  envFile: string;
  url: string;
  maskedIdentity: string;
};

export type DatabaseDiscovery = {
  databases: DiscoveredDatabase[];
  missing: string[];
};

const ENV_FILES: Array<{ name: string; file: string }> = [
  { name: 'default', file: '.env' },
  { name: 'training', file: '.env.training' },
  { name: 'prod', file: '.env.prod' },
  { name: 'demo', file: '.env.demo' },
];

export async function discoverDatabases(
  repoRoot: string
): Promise<DatabaseDiscovery> {
  const databases: DiscoveredDatabase[] = [];
  const missing: string[] = [];

  for (const envFile of ENV_FILES) {
    const filePath = path.join(repoRoot, envFile.file);
    if (!(await pathExists(filePath))) {
      continue;
    }

    const content = await fs.promises.readFile(filePath, 'utf-8');
    const url = extractDatabaseUrl(content);
    if (!url) {
      missing.push(envFile.file);
      continue;
    }

    databases.push({
      name: envFile.name,
      envFile: filePath,
      url,
      maskedIdentity: maskDatabaseUrl(url),
    });
  }

  return { databases, missing };
}

function extractDatabaseUrl(content: string): string | null {
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const line = trimmed.startsWith('export ')
      ? trimmed.slice('export '.length)
      : trimmed;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    if (key !== 'DATABASE_URL') {
      continue;
    }

    let value = line.slice(eqIndex + 1).trim();
    value = value.replace(/\s+#.*$/, '');
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value || null;
  }

  return null;
}

export function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol;
    const portSegment = parsed.port ? ':***' : '';
    return `${protocol}//***:***@***${portSegment}/***`;
  } catch {
    return '<masked>';
  }
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.promises.access(targetPath);
    return true;
  } catch {
    return false;
  }
}
