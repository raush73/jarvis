import { ForbiddenException } from '@nestjs/common';

/**
 * Canonical permission assertion helper.
 *
 * Rules:
 * - Pure function (no side effects)
 * - Deterministic behavior
 * - No DB access
 * - No request/context assumptions
 */
export function assertHasPermissions(
  userPermissions: string[] | undefined | null,
  required: string[] | string,
  context?: string,
): void {
  const effective = userPermissions ?? [];

  const requiredList = Array.isArray(required) ? required : [required];

  const missing = requiredList.filter(
    (perm) => !effective.includes(perm),
  );

  if (missing.length > 0) {
    const ctx = context ? ` (${context})` : '';
    throw new ForbiddenException(
      `Missing required permission(s): ${missing.join(', ')}${ctx}`,
    );
  }
}
