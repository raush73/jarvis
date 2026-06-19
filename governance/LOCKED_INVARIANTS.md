# LOCKED_INVARIANTS — Jarvis Prime Architectural Invariants (DO NOT VIOLATE)

## Database Architecture
- Dual database model is locked:
  - Training DB
  - Production DB
- No schema drift permitted between environments.

## Timesheet Model
- Working Timesheets → Editable internal workflow
- Snapshot Timesheets → Immutable system of record

## Payroll Scope (Jarvis Prime 1.0)
- Exports Payroll Packets only
- Does NOT execute payroll
- W-4 and I-9 MUST be in Jarvis Prime 1.0

## Invoice Governance
- Consecutive numbering required (audit)
- No deletion after issue/payment
- Voids/credits only

## Certification Gate
- Missing certs block dispatch eligibility

## Magic Link Architecture
- External actions default to action-scoped magic links
- Authentication-required links only by explicit override

## Shift Differential
- Additive delta only
- Stored at Job Order
- Mirrored into snapshots (no recompute)

## ZoomInfo Integration (Phase 11A)

- Legacy Enterprise API only
- Native fetch only
- No contact ingestion
- No ownership assignment during pull
- Lifecycle = LEAD on create
- No lifecycle downgrade on update
- Dedup chain = ZoomInfo ID → domain → name+state
- Re-pull must update, never duplicate

## Webex / Friday Phone Integration (2026-06-19)

- Single admin OAuth token is used for all Webex dialing; per-user OAuth is NOT required.
- Friday calls dial on behalf of the logged-in user via User.webexPersonId.
  - MUST NOT use /members/me/dial.
- Destination phone numbers MUST be normalized to E.164 before dialing.
- CallEvent is the canonical call record; no parallel phone-call model.
  - CallEvent.webexCallId stores the dial-response callId.
  - CallEvent.webexCallStatus stores the last observed Webex state.
- Webex webhook correlation matches on payload data.callId (NOT data.id).
- Disconnect detection has two paths that MUST stay convergent:
  - Primary: Webex webhook at POST /webex/events.
  - Fallback: poller via GET /telephony/calls/{callId}.
  - The poller MUST remain as fallback (do not remove).
  - Both MUST route through the single idempotent WebexCallReconcilerService.
- /webex/events MUST verify X-Spark-Signature (HMAC-SHA1) using WEBEX_WEBHOOK_SECRET over the raw body.
- Disconnect reconciliation stamps endedAt/durationSeconds/webexCallStatus only.
  - No automatic CallOutcome.
  - No automatic CallNote.
- Friday queue calls are CallSession-backed; disconnect flips IN_CALL -> COMPLETING and the
  frontend auto-opens the existing completion gate. Manual calls are not session-backed.

