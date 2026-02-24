function normList(v: any): string[] {
  const raw = Array.isArray(v) ? v : [];
  return raw.map((x: any) => String(x).toLowerCase());
}

export function hasAnyRole(user: any, roles: string[]): boolean {
  const userRoles = normList(user?.roles);
  const required = normList(roles);
  return required.some((r) => userRoles.includes(r));
}

export function hasAnyScope(user: any, scopes: string[]): boolean {
  // Keep scope semantics intact; normalize to be safe
  const userScopes = normList(user?.scopes);
  const required = normList(scopes);
  return required.some((s) => userScopes.includes(s));
}
