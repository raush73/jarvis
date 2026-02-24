// D:\JARVIS\02_backend\src\utils\normalize-company-name.ts

/**
 * Deterministic normalization for company names.
 * Explainable rules only (no AI).
 *
 * Rules:
 * - lowercase
 * - trim
 * - remove punctuation/symbols (keep letters/numbers/spaces)
 * - collapse whitespace
 * - remove common legal suffixes (llc, inc, ltd, corp, co, company, etc.)
 */
export function normalizeCompanyName(input: string): string {
    const raw = (input ?? '').toLowerCase().trim();
  
    // Replace anything that's not a-z, 0-9, or whitespace with space
    const noPunct = raw.replace(/[^a-z0-9\s]/g, ' ');
  
    // Collapse whitespace
    const collapsed = noPunct.replace(/\s+/g, ' ').trim();
  
    if (!collapsed) return '';
  
    const suffixes = new Set([
      'llc',
      'inc',
      'ltd',
      'corp',
      'co',
      'company',
      'corporation',
      'incorporated',
      'limited',
      'plc',
      'lp',
      'llp',
      'pc',
      'gmbh',
      'sa',
      'bv',
      'sarl',
    ]);
  
    const tokens = collapsed.split(' ');
    const filtered = tokens.filter((t) => t && !suffixes.has(t));
  
    // If everything was a suffix, fall back to collapsed
    return (filtered.length ? filtered : tokens).join(' ').trim();
  }
  