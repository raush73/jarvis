# HANDOFF_CURRENT - Jarvis Prime Session Continuity

## Build Environment
Primary Drive: E:\JARVIS
Infra: AWS EC2 + Nginx reverse proxy + PM2

## Active Runtime Ports (EC2)
| Service | Port |
|---------|------|
| Prod Backend | 3000 |
| Frontend | 3001 |
| Training Backend | 3002 |

## Guardrails (MANDATORY - PLATFORM AWARE)

Windows/local:
- npm run audit:api

EC2/Linux (run in order when deploying/wiring backend):
1) npm run guardian:schema
2) npm run sentinel:infra
3) npm run log:triage

---

## SESSION UPDATE (2026-02-16)

### Packet 5 ? Customer Search + Filters

STATUS: UI SHELL COMPLETE

Completed:
- Search input with 350ms debounce
- Type filter (All / Customer / Prospect)
- Salesperson filter (derived from mock data)
- Sort selector (Name / Created / Revenue)
- Order selector (Asc / Desc)
- Page size selector (25 / 50 / 100)
- Pagination controls (Prev / Next + Page display)
- Styled-jsx scoped controls row
- No backend wiring performed
- MOCK_CUSTOMERS still active
- No schema changes
- No governance file drift

### Local Dev Status

Resolved:
- Turbopack root mis-detection
- Tailwind resolution conflict
- Local 
pm run dev functioning
- EC2 deployment verified
- PM2 frontend restarted successfully

---

## CURRENT POSITION

Next Objective:
Wire /api/customers to replace MOCK_CUSTOMERS with real data (training DB).

Scope:
Frontend ? backend wiring only.
No schema edits.
No new UI expansion.
No refactors.

---

## Repo Expectation
- Clean working tree before next feature
- No package.json edits unless explicitly required
- No bot modifications


---

## SESSION START PROTOCOL (MANDATORY FOR NEXT AXEL)

Before making ANY changes:

1) Michael must print this file using:

   cd E:\JARVIS
   Get-Content governance\HANDOFF_CURRENT.md

2) Michael will paste the full contents into the new session.

3) Axel MUST:
   - Read the entire file
   - Confirm current objective
   - Confirm repo expected clean
   - Confirm scope boundaries
   - Confirm no drift

4) Axel must respond with:

ACKNOWLEDGED:
- Handoff file read
- Objective confirmed
- Repo state assumed clean
- Scope locked

If any of the above cannot be confirmed, STOP.

No work may begin until acknowledgment is complete.

---

