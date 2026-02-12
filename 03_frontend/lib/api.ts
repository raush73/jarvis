/**
 * API base strategy:
 * - Local dev (hostname=localhost): talk directly to backend on 3000
 * - Deployed (demo.jarvisprime.io): call SAME-ORIGIN /api/* (nginx proxies /api -> backend)
 *
 * Optional override:
 *   NEXT_PUBLIC_API_BASE can force a full base URL if ever needed.
 */
export const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_BASE ??
        (window.location.hostname === "localhost"
          ? "http://127.0.0.1:3000"
          : "/api"))
    : (process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:3000");

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("jp_accessToken");
  } catch {
    return null;
  }
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("jp_accessToken");
  } catch {
    // ignore
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    // If auth is invalid/expired, clear token so UI can recover cleanly
    if (res.status === 401 || res.status === 403) {
      clearAccessToken();
    }
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }

  return (await res.json()) as T;
}
