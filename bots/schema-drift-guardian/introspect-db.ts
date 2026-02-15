import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

import { parsePrismaSchema, PrismaSchema } from './discover-prisma';
import { DiscoveredDatabase } from './discover-databases';

export type IntrospectionResult = {
  environment: DiscoveredDatabase;
  schema: PrismaSchema;
  schemaPath: string;
};

export async function introspectDatabaseSchema(params: {
  environment: DiscoveredDatabase;
  prismaSchemaPath: string;
  repoRoot: string;
  tmpDir: string;
}): Promise<IntrospectionResult> {
  const { environment, prismaSchemaPath, repoRoot, tmpDir } = params;
  await fs.promises.mkdir(tmpDir, { recursive: true });

  const tempSchemaPath = path.join(tmpDir, `${environment.name}-schema.prisma`);
  await fs.promises.copyFile(prismaSchemaPath, tempSchemaPath);

  await runPrismaDbPull({
    schemaPath: tempSchemaPath,
    repoRoot,
    databaseUrl: environment.url,
  });

  const schema = await parsePrismaSchema(tempSchemaPath);
  return { environment, schema, schemaPath: tempSchemaPath };
}

async function runPrismaDbPull(params: {
  schemaPath: string;
  repoRoot: string;
  databaseUrl: string;
}): Promise<void> {
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const { schemaPath, repoRoot, databaseUrl } = params;

  await spawnCommand(npxCommand, ['prisma', 'db', 'pull', '--schema', schemaPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  });
}

function spawnCommand(
  command: string,
  args: string[],
  options: {
    cwd: string;
    env: NodeJS.ProcessEnv;
  }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: 'pipe',
    });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `Prisma introspection failed with exit code ${code ?? 'unknown'}.${
            stderr ? ` ${stderr.trim()}` : ''
          }`
        )
      );
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}
