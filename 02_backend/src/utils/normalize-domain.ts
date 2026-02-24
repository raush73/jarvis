// src/utils/normalize-domain.ts
export function normalizeDomain(input?: string | null): string | null {
    if (!input) return null;
  
    let s = String(input).trim().toLowerCase();
    if (!s) return null;
  
    // If it's a URL, parse it; otherwise treat as raw domain.
    // We avoid throwing by catching URL parse errors.
    try {
      // Add protocol if missing so URL parsing works for "example.com/path"
      const withProtocol = s.startsWith('http://') || s.startsWith('https://') ? s : `https://${s}`;
      const url = new URL(withProtocol);
      s = url.hostname.toLowerCase();
    } catch {
      // Not a URL; continue with the raw input
    }
  
    // Strip leading "www."
    if (s.startsWith('www.')) s = s.slice(4);
  
    // Remove trailing dot (rare but possible)
    while (s.endsWith('.')) s = s.slice(0, -1);
  
    return s || null;
  }
  