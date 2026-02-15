import * as fs from 'fs';

import type { FingerprintSummary } from './fingerprint-errors';
import type { Severity } from './classify-severity';

export type FingerprintStatus = 'NEW' | 'KNOWN';

export interface FingerprintWithStatus extends FingerprintSummary {
  severity: Severity;
  status: FingerprintStatus;
}

export interface BaselineFile {
  version: number;
  initialized: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  lastRunAt: string | null;
  fingerprints: string[];
}

export interface BaselineState {
  path: string;
  file: BaselineFile;
  existed: boolean;
}

const DEFAULT_BASELINE: BaselineFile = {
  version: 1,
  initialized: false,
  createdAt: null,
  updatedAt: null,
  lastRunAt: null,
  fingerprints: [],
};

export function loadBaseline(baselinePath: string): BaselineState {
  if (!fs.existsSync(baselinePath)) {
    return { path: baselinePath, file: { ...DEFAULT_BASELINE }, existed: false };
  }

  try {
    const raw = fs.readFileSync(baselinePath, 'utf-8');
    const parsed = JSON.parse(raw) as BaselineFile;
    return {
      path: baselinePath,
      file: { ...DEFAULT_BASELINE, ...parsed },
      existed: true,
    };
  } catch {
    return { path: baselinePath, file: { ...DEFAULT_BASELINE }, existed: true };
  }
}

export function markNewErrors(
  fingerprints: Array<FingerprintSummary & { severity: Severity }>,
  baselineState: BaselineState,
  options: { updateBaseline: boolean }
): {
  fingerprints: FingerprintWithStatus[];
  baseline: BaselineFile;
  baselineCreated: boolean;
} {
  const now = new Date().toISOString();
  const baseline = { ...baselineState.file };
  const baselineCreated = !baseline.initialized;
  const fingerprintSet = new Set(baseline.fingerprints);

  if (baselineCreated) {
    for (const fingerprint of fingerprints) {
      fingerprintSet.add(fingerprint.id);
    }
    baseline.createdAt = now;
    baseline.initialized = true;
  }

  const results: FingerprintWithStatus[] = fingerprints.map((fingerprint) => {
    const isKnown = fingerprintSet.has(fingerprint.id);
    const status: FingerprintStatus = isKnown ? 'KNOWN' : 'NEW';
    return { ...fingerprint, status };
  });

  if (options.updateBaseline) {
    for (const fingerprint of fingerprints) {
      fingerprintSet.add(fingerprint.id);
    }
    baseline.updatedAt = now;
  }

  baseline.fingerprints = Array.from(fingerprintSet);
  baseline.lastRunAt = now;
  if (!baseline.updatedAt) baseline.updatedAt = now;

  return { fingerprints: results, baseline, baselineCreated };
}

export function saveBaseline(baseline: BaselineFile, baselinePath: string): void {
  const formatted = JSON.stringify(baseline, null, 2);
  fs.writeFileSync(baselinePath, formatted + '\n', 'utf-8');
}
