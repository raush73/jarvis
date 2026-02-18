# JARVIS PRIME -- SESSION HANDOFF

Date: 2026-02-17
Primary Objective (BLOCKER): Restore local backend DB connectivity so login works
Feature Context (PAUSED): Packet 1 - Customers Wiring (cannot proceed until login works)

## Reality Check
We are NOT doing customer wiring right now.
We are blocked on:

Local backend DB connectivity -> prevents /readyz -> prevents /auth/login -> prevents /customers -> prevents any wiring.

## Deterministic Success Criteria (must be green before feature work)
1) GET /readyz -> { ok: true }
2) POST /auth/login -> { ok: true, accessToken: ... }
3) GET /customers (with token) -> returns rows

Until (1) is green, do NOT touch:
- Prisma schema / migrations
- Auth guards or token logic
- Controllers or frontend wiring