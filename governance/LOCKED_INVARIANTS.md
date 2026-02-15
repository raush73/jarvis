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
