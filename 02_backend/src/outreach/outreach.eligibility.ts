/**
 * Phase 23.4 — Eligibility + Targeting
 *
 * Hard rule (locked):
 * - Do NOT send outreach to candidates who are currently ON_ASSIGNMENT.
 *
 * Notes:
 * - We intentionally do NOT hard-filter missing certs here.
 * - Availability filtering will be layered in after we confirm canonical statuses.
 */

export type CandidateOutreachEligibilityInput = {
    candidateId: string;
    // Using string union here to avoid coupling to Prisma enums in a pure helper.
    status: string;
  };
  
  export function isEligibleForOutreach(input: CandidateOutreachEligibilityInput): boolean {
    // Hard exclusion: already out on assignment
    if (input.status === "ON_ASSIGNMENT") return false;
  
    return true;
  }
  