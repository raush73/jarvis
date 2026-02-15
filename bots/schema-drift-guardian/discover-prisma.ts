import * as fs from 'fs';
import * as path from 'path';

export type PrismaField = {
  name: string;
  type: string;
  rawType: string;
  isList: boolean;
  isOptional: boolean;
  ignored: boolean;
};

export type PrismaModel = {
  name: string;
  fields: Record<string, PrismaField>;
  fieldOrder: string[];
  ignored: boolean;
};

export type PrismaEnum = {
  name: string;
  values: string[];
};

export type PrismaSchema = {
  models: Record<string, PrismaModel>;
  enums: Record<string, PrismaEnum>;
  types: Record<string, PrismaModel>;
};

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'reports',
  'bots',
]);

export async function findPrismaSchemaPath(repoRoot: string): Promise<string> {
  const direct = path.join(repoRoot, 'prisma', 'schema.prisma');
  if (await pathExists(direct)) {
    return direct;
  }

  const discovered = await findSchemaInRepo(repoRoot);
  if (!discovered) {
    throw new Error('Prisma schema not found. Expected prisma/schema.prisma.');
  }
  return discovered;
}

export async function parsePrismaSchema(schemaPath: string): Promise<PrismaSchema> {
  const contents = await fs.promises.readFile(schemaPath, 'utf-8');
  return parseSchemaString(contents);
}

function parseSchemaString(schema: string): PrismaSchema {
  const cleaned = stripComments(schema);
  const models: Record<string, PrismaModel> = {};
  const enums: Record<string, PrismaEnum> = {};
  const types: Record<string, PrismaModel> = {};

  const blockRegex = /\b(model|enum|type)\s+(\w+)\s*\{([\s\S]*?)\}/g;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(cleaned)) !== null) {
    const kind = match[1];
    const name = match[2];
    const body = match[3] ?? '';

    if (kind === 'enum') {
      enums[name] = parseEnumBlock(name, body);
      continue;
    }

    const model = parseModelBlock(name, body);
    if (kind === 'model') {
      models[name] = model;
    } else {
      types[name] = model;
    }
  }

  return { models, enums, types };
}

function parseEnumBlock(name: string, body: string): PrismaEnum {
  const values: string[] = [];
  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) {
      continue;
    }
    if (trimmed.startsWith('@')) {
      continue;
    }
    const token = trimmed.split(/\s+/)[0];
    if (token) {
      values.push(token);
    }
  }
  return { name, values };
}

function parseModelBlock(name: string, body: string): PrismaModel {
  const fields: Record<string, PrismaField> = {};
  const fieldOrder: string[] = [];
  const ignored = body.includes('@@ignore');

  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) {
      continue;
    }
    if (trimmed.startsWith('@')) {
      continue;
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) {
      continue;
    }

    const nameToken = parts[0];
    const typeToken = parts[1];
    const ignoredField = trimmed.includes('@ignore');
    const { baseType, isList, isOptional } = parseTypeToken(typeToken);

    fields[nameToken] = {
      name: nameToken,
      type: baseType,
      rawType: typeToken,
      isList,
      isOptional,
      ignored: ignoredField,
    };
    fieldOrder.push(nameToken);
  }

  return { name, fields, fieldOrder, ignored };
}

function parseTypeToken(typeToken: string): {
  baseType: string;
  isList: boolean;
  isOptional: boolean;
} {
  let base = typeToken;
  let isList = false;
  let isOptional = false;

  if (base.endsWith('[]')) {
    isList = true;
    base = base.slice(0, -2);
  }
  if (base.endsWith('?')) {
    isOptional = true;
    base = base.slice(0, -1);
  }

  return { baseType: base, isList, isOptional };
}

function stripComments(schema: string): string {
  const withoutBlock = schema.replace(/\/\*[\s\S]*?\*\//g, '');
  return withoutBlock.replace(/\/\/.*$/gm, '');
}

async function findSchemaInRepo(repoRoot: string): Promise<string | null> {
  const queue: string[] = [repoRoot];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const entries = await fs.promises.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) {
          continue;
        }
        queue.push(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name === 'schema.prisma') {
        if (path.basename(path.dirname(fullPath)) === 'prisma') {
          return fullPath;
        }
      }
    }
  }

  return null;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.promises.access(targetPath);
    return true;
  } catch {
    return false;
  }
}
