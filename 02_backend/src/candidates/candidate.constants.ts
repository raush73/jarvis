/**
 * Phase 21.2 — Candidate Foundation
 *
 * We keep Candidate.status as a STRING in Prisma for now (no migration risk),
 * but we enforce allowed values in the service layer so later phases can rely on determinism.
 */

export const CANDIDATE_AVAILABILITY = {
  ACTIVE_SEEKING: "ACTIVE_SEEKING",
  NOT_ACTIVE: "NOT_ACTIVE",
} as const;

export type CandidateAvailability =
  (typeof CANDIDATE_AVAILABILITY)[keyof typeof CANDIDATE_AVAILABILITY];

export function isCandidateAvailability(value: any): value is CandidateAvailability {
  return value === CANDIDATE_AVAILABILITY.ACTIVE_SEEKING || value === CANDIDATE_AVAILABILITY.NOT_ACTIVE;
}
