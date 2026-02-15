import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export type SourceStatus = 'OK' | 'MISSING' | 'ERROR';

export interface LogSourceConfig {
  label: string;
  paths: string[];
}

export interface LogFileResult {
  path: string;
  status: 'OK' | 'MISSING' | 'SKIPPED' | 'ERROR';
  reason?: string;
  lineCount: number;
}

export interface LogSourceResult {
  label: string;
  status: SourceStatus;
  files: LogFileResult[];
}

export interface LogEntry {
  source: string;
  filePath: string;
  lines: string[];
  message: string;
  timestamp?: Date;
}

export interface IngestOptions {
  maxLines: number;
  since?: Date;
  maxFileSizeBytes?: number;
  maxReadBytes?: number;
}

const DEFAULT_MAX_FILE_SIZE = 1024 * 1024 * 512; // 512 MB
const DEFAULT_MAX_READ_BYTES = 1024 * 1024 * 8; // 8 MB
const CHUNK_SIZE = 1024 * 64;

function resolveHomePath(target: string): string {
  if (target.startsWith('~')) {
    return path.join(os.homedir(), target.slice(1));
  }
  return target;
}

function isRotatedLog(name: string, baseName: string): boolean {
  if (!name.startsWith(baseName + '.')) return false;
  if (name.endsWith('.gz')) return false;
  return true;
}

function isLogFileName(name: string): boolean {
  if (name.endsWith('.gz')) return false;
  return name.endsWith('.log') || name.includes('.log.');
}

function collectLogFiles(targetPath: string): {
  resolvedPath: string;
  files: string[];
  missing: boolean;
} {
  const resolvedPath = resolveHomePath(targetPath);
  if (!fs.existsSync(resolvedPath)) {
    return { resolvedPath, files: [], missing: true };
  }

  const stat = fs.statSync(resolvedPath);
  if (stat.isDirectory()) {
    const entries = fs.readdirSync(resolvedPath);
    const files = entries
      .map((entry) => path.join(resolvedPath, entry))
      .filter((entryPath) => {
        try {
          const entryStat = fs.statSync(entryPath);
          return entryStat.isFile() && isLogFileName(path.basename(entryPath));
        } catch {
          return false;
        }
      });
    return { resolvedPath, files, missing: false };
  }

  if (!stat.isFile()) {
    return { resolvedPath, files: [], missing: true };
  }

  const dir = path.dirname(resolvedPath);
  const baseName = path.basename(resolvedPath);
  const entries = fs.readdirSync(dir);
  const rotated = entries
    .filter((entry) => isRotatedLog(entry, baseName))
    .map((entry) => path.join(dir, entry));
  return {
    resolvedPath,
    files: [resolvedPath, ...rotated],
    missing: false,
  };
}

function readLastLines(
  filePath: string,
  maxLines: number,
  maxReadBytes: number
): string[] {
  const stat = fs.statSync(filePath);
  const size = stat.size;
  if (size === 0) return [];

  const fd = fs.openSync(filePath, 'r');
  let position = size;
  let content = '';
  let totalRead = 0;

  try {
    while (position > 0 && totalRead < maxReadBytes) {
      const readSize = Math.min(CHUNK_SIZE, position);
      position -= readSize;
      const buffer = Buffer.alloc(readSize);
      fs.readSync(fd, buffer, 0, readSize, position);
      totalRead += readSize;
      content = buffer.toString('utf8') + content;

      const lines = content.split(/\r?\n/);
      if (lines.length > maxLines) {
        return lines.slice(-maxLines);
      }
    }
  } finally {
    fs.closeSync(fd);
  }

  const finalLines = content.split(/\r?\n/);
  return finalLines.slice(-maxLines);
}

function extractTimestamp(line: string): Date | undefined {
  const isoMatch = line.match(
    /\b(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)\b/
  );
  if (isoMatch) {
    const parsed = new Date(isoMatch[1]);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const altMatch = line.match(
    /\b(\d{4}\/\d{2}\/\d{2}[ T]\d{2}:\d{2}:\d{2})\b/
  );
  if (altMatch) {
    const parsed = new Date(altMatch[1].replace(' ', 'T'));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const syslogMatch = line.match(
    /\b([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\b/
  );
  if (syslogMatch) {
    const now = new Date();
    const month = syslogMatch[1];
    const day = Number(syslogMatch[2]);
    const hour = Number(syslogMatch[3]);
    const minute = Number(syslogMatch[4]);
    const second = Number(syslogMatch[5]);
    const monthIndex = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ].indexOf(month);
    if (monthIndex >= 0) {
      const parsed = new Date(
        now.getFullYear(),
        monthIndex,
        day,
        hour,
        minute,
        second
      );
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }

  return undefined;
}

function isNewEntryStart(line: string, timestamp?: Date): boolean {
  if (timestamp) return true;
  if (/^\[(ERROR|WARN|INFO|DEBUG|TRACE|FATAL)\]/i.test(line)) return true;
  if (/^(ERROR|WARN|INFO|DEBUG|TRACE|FATAL)\b/i.test(line)) return true;
  return false;
}

function isContinuation(line: string): boolean {
  if (/^\s+at\s+/.test(line)) return true;
  if (/^\s+/.test(line)) return true;
  if (/^Caused by:/i.test(line)) return true;
  return false;
}

function parseLogEntries(
  lines: string[],
  source: string,
  filePath: string,
  since?: Date
): LogEntry[] {
  const entries: LogEntry[] = [];
  let current: { lines: string[]; timestamp?: Date } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');
    if (!line && !current) continue;
    const timestamp = extractTimestamp(line);
    const newEntry = isNewEntryStart(line, timestamp);

    if (newEntry) {
      if (current) {
        entries.push({
          source,
          filePath,
          lines: current.lines,
          message: current.lines[0] ?? '',
          timestamp: current.timestamp,
        });
      }
      current = { lines: [line], timestamp };
      continue;
    }

    if (!current) {
      current = { lines: [line], timestamp };
      continue;
    }

    if (isContinuation(line)) {
      current.lines.push(line);
    } else {
      current.lines.push(line);
    }
  }

  if (current) {
    entries.push({
      source,
      filePath,
      lines: current.lines,
      message: current.lines[0] ?? '',
      timestamp: current.timestamp,
    });
  }

  if (!since) return entries;
  return entries.filter((entry) => {
    if (!entry.timestamp) return true;
    return entry.timestamp >= since;
  });
}

export function ingestLogs(
  sources: LogSourceConfig[],
  options: IngestOptions
): { entries: LogEntry[]; sources: LogSourceResult[] } {
  const entries: LogEntry[] = [];
  const sourceResults: LogSourceResult[] = [];

  let accessibleFiles = 0;
  const maxFileSize = options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE;
  const maxReadBytes = options.maxReadBytes ?? DEFAULT_MAX_READ_BYTES;

  for (const source of sources) {
    const fileResults: LogFileResult[] = [];
    let sourceOk = false;

    for (const targetPath of source.paths) {
      const { resolvedPath, files, missing } = collectLogFiles(targetPath);
      if (missing) {
        fileResults.push({
          path: resolvedPath,
          status: 'MISSING',
          lineCount: 0,
        });
        continue;
      }

      if (files.length === 0) {
        fileResults.push({
          path: resolvedPath,
          status: 'MISSING',
          lineCount: 0,
          reason: 'No .log files found',
        });
        continue;
      }

      for (const filePath of files) {
        if (filePath.endsWith('.gz')) {
          fileResults.push({
            path: filePath,
            status: 'SKIPPED',
            lineCount: 0,
            reason: 'Compressed logs not supported',
          });
          continue;
        }

        try {
          const stat = fs.statSync(filePath);
          if (stat.size > maxFileSize) {
            throw new Error(`STOP: File too large to process (${filePath})`);
          }

          const lines = readLastLines(filePath, options.maxLines, maxReadBytes);
          const parsed = parseLogEntries(
            lines,
            source.label,
            filePath,
            options.since
          );
          entries.push(...parsed);
          accessibleFiles += 1;
          sourceOk = true;
          fileResults.push({
            path: filePath,
            status: 'OK',
            lineCount: lines.length,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.includes('STOP:')) {
            throw new Error(message);
          }
          if (message.includes('EACCES')) {
            throw new Error(`STOP: Permission denied reading ${filePath}`);
          }
          fileResults.push({
            path: filePath,
            status: 'ERROR',
            lineCount: 0,
            reason: message,
          });
        }
      }
    }

    const status: SourceStatus = sourceOk
      ? 'OK'
      : fileResults.some((file) => file.status === 'ERROR')
      ? 'ERROR'
      : 'MISSING';
    sourceResults.push({
      label: source.label,
      status,
      files: fileResults,
    });
  }

  if (accessibleFiles === 0) {
    throw new Error('STOP: No logs accessible');
  }

  return { entries, sources: sourceResults };
}
