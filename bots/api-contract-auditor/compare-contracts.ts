/**
 * API Contract Auditor — Contract Comparator
 * Normalizes and matches frontend calls vs backend routes
 */

import type { FrontendCall } from './scan-frontend';
import type { BackendRoute } from './scan-backend';

export interface MatchResult {
  frontend: FrontendCall;
  backend: BackendRoute;
  methodMatch: boolean;
}

export interface AuditResult {
  frontendCalls: FrontendCall[];
  backendRoutes: BackendRoute[];
  matched: MatchResult[];
  missingBackend: FrontendCall[];
  methodMismatches: MatchResult[];
  coveragePercent: number;
}

/**
 * Normalize path for comparison: /orders/123 -> /orders/:id, /orders/abc -> /orders/:id
 */
function toPattern(p: string): string {
  const parts = p.split('/').filter(Boolean);
  return parts
    .map((seg) => {
      if (/^[a-f0-9-]{20,}$/i.test(seg) || /^\d+$/.test(seg) || /^c[a-z0-9]{24}$/i.test(seg)) {
        return ':id';
      }
      return seg;
    })
    .join('/');
}

function pathMatches(frontPath: string, backPath: string): boolean {
  const f = frontPath.replace(/\/$/, '') || '';
  const b = backPath.replace(/\/$/, '') || '';

  const fParts = f.split('/').filter(Boolean);
  const bParts = b.split('/').filter(Boolean);

  if (fParts.length !== bParts.length) return false;

  for (let i = 0; i < fParts.length; i++) {
    const fp = fParts[i];
    const bp = bParts[i];
    if (bp === ':id' || bp === ':invoiceId' || bp === ':orderId' || /^:[a-zA-Z]+$/.test(bp)) {
      continue;
    }
    if (fp !== bp) return false;
  }
  return true;
}

export function compareContracts(
  frontendCalls: FrontendCall[],
  backendRoutes: BackendRoute[]
): AuditResult {
  const matched: MatchResult[] = [];
  const missingBackend: FrontendCall[] = [];
  const methodMismatches: MatchResult[] = [];

  const backendByPath = new Map<string, BackendRoute[]>();
  for (const r of backendRoutes) {
    const key = r.fullPath;
    if (!backendByPath.has(key)) backendByPath.set(key, []);
    backendByPath.get(key)!.push(r);
  }

  for (const fc of frontendCalls) {
    let found: BackendRoute | null = null;
    let methodMatch = false;

    for (const br of backendRoutes) {
      if (pathMatches(fc.path, br.fullPath)) {
        found = br;
        methodMatch = fc.method === br.method;
        break;
      }
    }

    if (found) {
      matched.push({ frontend: fc, backend: found, methodMatch });
      if (!methodMatch) {
        methodMismatches.push({ frontend: fc, backend: found, methodMatch: false });
      }
    } else {
      missingBackend.push(fc);
    }
  }

  const totalCalls = frontendCalls.length;
  const matchedCount = matched.filter((m) => m.methodMatch).length;
  const coveragePercent = totalCalls > 0 ? Math.round((matchedCount / totalCalls) * 100) : 100;

  return {
    frontendCalls,
    backendRoutes,
    matched,
    missingBackend,
    methodMismatches,
    coveragePercent,
  };
}
