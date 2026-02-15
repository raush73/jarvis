import * as crypto from 'crypto';
import type { LogEntry } from './ingest-logs';

export interface FingerprintSummary {
  id: string;
  signature: string;
  errorName: string;
  message: string;
  topFrame: string | null;
  endpoint: string | null;
  count: number;
  example: LogEntry;
  sources: string[];
}

function isErrorLike(entry: LogEntry): boolean {
  const text = entry.lines.join(' ').toLowerCase();
  return (
    text.includes('error') ||
    text.includes('exception') ||
    text.includes('fail') ||
    text.includes('fatal') ||
    text.includes('warn') ||
    text.includes('unhandled') ||
    /\b5\d\d\b/.test(text)
  );
}

function normalizeMessage(message: string): string {
  return message
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      '<uuid>'
    )
    .replace(/\b[0-9a-f]{8,}\b/gi, '<hex>')
    .replace(/\b\d+\b/g, '<num>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractErrorName(text: string): string {
  const nameMatch = text.match(
    /\b([A-Z][A-Za-z0-9_]*(?:Error|Exception))\b/
  );
  if (nameMatch) return nameMatch[1];
  if (/UnhandledPromiseRejection/i.test(text)) return 'UnhandledPromiseRejection';
  if (/Unhandled/i.test(text)) return 'UnhandledError';
  return 'UnknownError';
}

function extractMessage(lines: string[], errorName: string): string {
  for (const line of lines) {
    const nameIndex = line.indexOf(errorName);
    if (nameIndex >= 0) {
      const afterName = line.slice(nameIndex + errorName.length).trim();
      if (afterName.startsWith(':')) {
        return afterName.slice(1).trim();
      }
    }
  }
  return lines[0] ?? '';
}

function extractTopFrame(lines: string[]): string | null {
  for (const line of lines) {
    const match = line.match(/^\s*at\s+(.*)$/);
    if (match) return match[1].trim();
  }
  return null;
}

function extractEndpoint(lines: string[]): string | null {
  for (const line of lines) {
    const match = line.match(
      /\b(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+([^\s]+)/i
    );
    if (match) {
      return `${match[1].toUpperCase()} ${match[2]}`;
    }
  }
  return null;
}

function createFingerprintId(signature: string): string {
  return crypto.createHash('sha1').update(signature).digest('hex');
}

export function fingerprintErrors(entries: LogEntry[]): FingerprintSummary[] {
  const map = new Map<string, FingerprintSummary>();

  for (const entry of entries) {
    if (!isErrorLike(entry)) continue;
    const text = entry.lines.join('\n');
    const errorName = extractErrorName(text);
    const message = normalizeMessage(extractMessage(entry.lines, errorName));
    const topFrame = extractTopFrame(entry.lines);
    const endpoint = extractEndpoint(entry.lines);

    const signature = [
      errorName,
      message,
      topFrame ?? 'no-frame',
      endpoint ?? 'no-endpoint',
    ].join('|');
    const id = createFingerprintId(signature);

    const existing = map.get(id);
    if (existing) {
      existing.count += 1;
      if (!existing.sources.includes(entry.source)) {
        existing.sources.push(entry.source);
      }
      continue;
    }

    map.set(id, {
      id,
      signature,
      errorName,
      message,
      topFrame,
      endpoint,
      count: 1,
      example: entry,
      sources: [entry.source],
    });
  }

  return Array.from(map.values());
}
