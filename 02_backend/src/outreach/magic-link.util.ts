import { randomBytes } from "crypto";

/**
 * Phase 23.5 — Magic Link Infrastructure (LEGACY)
 *
 * ⚠️ DEPRECATED: This utility is legacy code and should NOT be used for new features.
 * 
 * For Phase 25+ development, use MagicLinksService instead:
 * - MagicLinksService provides DB persistence, token hashing, and atomic consumption
 * - MagicLinksService enforces scope validation and expiration checks
 * - MagicLinksService supports multi-open, single-submit semantics
 * 
 * This file is preserved for backward compatibility only.
 * 
 * Legacy rules (locked):
 * - Action-scoped (outreach only)
 * - Expiring
 * - No login required
 */

/** @deprecated Use MagicLinksService.createMagicLink() instead. This type is preserved for backward compatibility only. */
export type MagicLinkPayload = {
  scope: "outreach";
  candidateId: string;
  orderId: string;
};

/** @deprecated Use MagicLinksService instead. This type is preserved for backward compatibility only. */
export type MagicLink = {
  token: string;
  expiresAt: string;
  payload: MagicLinkPayload;
};

/**
 * @deprecated Use MagicLinksService.createMagicLink() instead.
 * 
 * This function is legacy code from Phase 23.5. It creates in-memory magic links
 * without DB persistence, which is not suitable for production use in Phase 25+.
 * 
 * For new code, inject MagicLinksService and call createMagicLink().
 * 
 * This function is only kept for backward compatibility with the legacy send() method
 * in OutreachService. DO NOT use this in any new code paths.
 */
export function generateMagicLink(
  payload: MagicLinkPayload,
  ttlMinutes: number,
): MagicLink {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();

  return {
    token,
    expiresAt,
    payload,
  };
}

/**
 * @deprecated This function should not be used. Use MagicLinksService.validateOrThrow() or consumeOrThrow() instead.
 * 
 * MagicLinksService handles expiration checking as part of its validation logic.
 * This function is deprecated and will throw an error if called.
 * 
 * @throws Error Always throws, explaining that MagicLinksService must be used instead.
 */
export function isMagicLinkExpired(expiresAt: string): boolean {
  throw new Error(
    "isMagicLinkExpired() is deprecated and disabled. Use MagicLinksService.validateOrThrow() or consumeOrThrow() instead. " +
    "MagicLinksService provides proper expiration checking with DB-backed validation."
  );
}
