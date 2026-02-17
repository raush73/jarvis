# HANDOFF_CURRENT — EC2 (demo.jarvisprime.io)
Date: 2026-02-17
Host: ip-172-31-65-101
Repo: /opt/jarvis-frontend (frontend)
Frontend app root: /opt/jarvis-frontend/03_frontend
PM2 apps: jarvis-frontend (3001), jarvis-backend (3000), jarvis-backend-dev (3002)

## What happened (high signal)

### A) Git hygiene / governance
- `node_modules/` was NOT ignored on EC2.
- Added `node_modules/` to `.gitignore`, removed cached node_modules, deleted stray `governance/HANDOFF_CURRENT.md.bak.*`.
- Committed + pushed:
  - Commit: `d49c946` — "Governance: finalize 2026-02-17 HANDOFF_CURRENT + ignore node_modules"

### B) Terminal/editor issues (root causes + fix)
- `apply_patch` is NOT available on EC2 (command not found).
- Nano is disliked/avoided; edits were done via heredoc + python file patch scripts.
- A prior command failed because bash history expansion treated `!alive` as an event (error: `event not found`).
  - Fix used: `set +H` (disable history expansion) before running python patch scripts.

### C) Frontend outage / 502 recovery
- Browser showed `502 Bad Gateway (nginx)`.
- Root cause: `pm2 jarvis-frontend` kept restarting because Next.js couldn’t find a production build (`.next/BUILD_ID` missing).
- Confirmed `.next` existed but `BUILD_ID` missing.
- Fix: `rm -rf .next && npm run build` produced `.next/BUILD_ID`, then `pm2 restart jarvis-frontend`.
- After rebuild/restart, 3001 healthy again and Nginx proxy worked.

### D) Customers page wiring — preserve UI shell, remove mock data, show real customers
- Goal: Keep the existing Customers UI shell and replace mock data with real backend `GET /customers`.
- Customers backend validated via curl (83 records) against `jarvis-backend-dev` (port 3002) with JWT.

#### Key fixes made
1) Login token key mismatch fixed:
   - `app/login/page.tsx` previously stored token to `localStorage.setItem('accessToken', ...)`
   - Patched to `localStorage.setItem('jp_accessToken', data.accessToken);`
   - Deduped accidental duplicate line.

2) Customers page now fetches real customers and uses them in the shell:
   - `app/customers/page.tsx`
     - Added `apiFetch("/customers")` fetch effect into component
     - Swapped UI from `MOCK_CUSTOMERS` usage to `customers` state (length/map/total pages)
     - Set `UNIQUE_SALESPEOPLE` to `[]` temporarily because backend does not yet provide salesperson hydration fields used by the original mock UI.

#### Result
- `/customers` now renders the full shell AND shows real customer rows (83) with UUIDs.
- Some columns still display placeholder/odd values because those fields are not yet provided by backend:
  - Location
  - Main phone
  - Default salesperson
  - Last updated formatting may be incomplete until fields mapped

## Current system state (EC2)
- Listeners:
  - Nginx: :80
  - Frontend: :3001 (pm2 jarvis-frontend)
  - Backend prod-ish: :3000 (pm2 jarvis-backend)
  - Backend dev/training: :3002 (pm2 jarvis-backend-dev)
- Frontend builds successfully via:
  - `cd /opt/jarvis-frontend/03_frontend && npm run build`
- Frontend restart:
  - `pm2 restart jarvis-frontend`
- Customers API verified:
  - `POST /auth/login` on 3002 returns accessToken
  - `GET /customers` on 3002 returns 83 customers when Authorization Bearer token is provided

## What’s next (Option B — hydrate missing columns)
We are choosing **Option B**: hydrate fields so Customers UI shell columns are real:

1) Location column:
   - Decide mapping + backend fields (city/state OR single location string)
2) Main phone:
   - Determine source field(s) in backend customer model (or join to primary contact)
3) Default salesperson:
   - Backend must return enough data to display salesperson name (not just userId)
   - Likely needs include/join to Users (role=sales) and/or `defaultSalespersonUserId` hydration
4) Last updated:
   - Use `updatedAt` consistently and format on frontend

### Recommended order
1) Confirm backend Customer model fields available (or add them safely with migration if needed).
2) Update backend `GET /customers` DTO to include:
   - city, state (or location)
   - mainPhone
   - defaultSalesperson { id, name } (or at minimum defaultSalespersonName)
   - updatedAt already exists
3) Update frontend `app/customers/page.tsx` to render these new fields in the existing columns.
4) Only after confirmed working: remove `MOCK_CUSTOMERS` constant and unused mock-only code.

## Notes / gotchas
- `apply_patch` absent on EC2; use python patch scripts or heredoc file replacements.
- Run `set +H` before scripts if there is any `!` in the shell environment.
- If 502 reappears: check `pm2 logs jarvis-frontend` for `.next` build errors; rebuild `.next` and restart pm2.
