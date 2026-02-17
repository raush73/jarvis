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

## SESSION UPDATE (2026-02-16) — Clean Align + Restore Point + Next: Customer Wiring

### What we did (locked facts)
- DECISION: Use EC2 as the primary execution surface going forward (avoid local runtime due to local↔EC2 comms bugs). Local repo remains aligned as a restore surface.
- VERIFIED: Local and EC2 repos are identical and clean (main...origin/main; no working tree changes):
  - Backend commit: 1d9f3b5ffafc59ce5f1b9d136d6388eaf162c1bd
  - Frontend commit: 9ef9e10f2baf7b2187d037dbe1ae590f5b7a71c7
- BACKEND: Salespeople endpoint work already committed and pushed:
  - Commit: “Users: add /users/salespeople endpoint (role=sales)”
  - Endpoint: GET /users/salespeople (role=sales)
- RESTORE POINT (NON-MIRROR, immutable):
  - Path: D:\JARVIS_RESTORE_POINTS\2026-02-16_1744_Clean_Aligned
  - Robocopy summary: 7,816 dirs; 69,979 files; 1.501 GB; 0 FAILED; duration ~0:05:41
  - RESTORE_INFO.txt written inside restore point recording commit hashes + “Local and EC2 aligned, clean working tree.”

### What we do next (scope locked)
Objective: Begin Packet 5 “Customer wiring tab” — wire UI to real API data (training DB) and replace MOCK_CUSTOMERS.
Scope boundaries:
- Frontend↔backend wiring only
- NO schema edits
- NO UI expansion/refactors
- NO bot modifications
- NO package.json/package-lock edits unless explicitly required

### Required EC2 verification run order (locked)
EC2/Linux (run in order when wiring/deploying backend):
1) npm run guardian:schema
2) npm run sentinel:infra
3) npm run log:triage

### First actions tomorrow (surgical)
1) EC2: confirm repos clean + up to date (backend + frontend).
2) EC2: confirm training backend login works and GET /users/salespeople returns 200.
3) Determine the existing customers API endpoint (use what exists; do not introduce schema changes).
4) Frontend: replace MOCK_CUSTOMERS with API fetch; preserve existing Packet 5 controls + debounce behavior.
5) Verify filters/sort/pagination work with real data; no UI feature expansion.

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

