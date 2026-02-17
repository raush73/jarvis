# JARVIS PRIME — GOVERNANCE HANDOFF (SYSTEM OF RECORD)
Date: 2026-02-17
Environment: EC2 demo.jarvisprime.io (Amazon Linux 2023)
Timezone: America/Chicago
Owner: Michael (Architect)
Assistant: Axel (Governor)

--------------------------------------------------------------------
SECTION 0 — CURRENT VERIFIED STATE
--------------------------------------------------------------------

Backend:
- Running on EC2 training port 3002
- Auth login confirmed working
- JWT issued successfully
- GET /customers returns HTTP 200
- Data confirmed from training database

Frontend:
- Root: /opt/jarvis-frontend/03_frontend
- Customers list page currently uses MOCK_CUSTOMERS
- Customer detail page currently MOCK
- lib/api.ts correctly attaches Authorization header using localStorage key "jp_accessToken"
- useAuth.ts NOT wired to token (always returns isAuthenticated: false)

Deployment:
- Frontend expects SAME-ORIGIN "/api"
- nginx (or rewrites) must proxy "/api" to backend:3002

--------------------------------------------------------------------
SECTION 1 — WHAT CAUSED STALLS
--------------------------------------------------------------------

- Heredoc terminator truncation during large paste
- Truncated quoted python -c commands
- SSH session drop mid-paste
- Not actual system corruption

System itself is stable.
Only paste mechanics caused interruption.

--------------------------------------------------------------------
SECTION 2 — CANONICAL NEXT STEPS (STRICT ORDER)
--------------------------------------------------------------------

STEP 1 — Wire useAuth.ts
- isAuthenticated = true when localStorage has non-empty "jp_accessToken"
- Update demo banner accordingly

STEP 2 — Confirm "/api" routing
- nginx proxy to backend:3002
  OR
- Temporary explicit NEXT_PUBLIC_API_BASE

STEP 3 — Wire Customers LIST page
- Replace MOCK_CUSTOMERS
- useEffect -> apiFetch('/customers')
- Render UUID ids from backend

STEP 4 — Build & restart frontend
- npm run build
- pm2 restart jarvis-frontend
- Verify live data renders

STEP 5 — Wire Customer detail page (after list confirmed)

--------------------------------------------------------------------
SECTION 3 — GOVERNANCE RULE
--------------------------------------------------------------------

EC2 is the runtime system of record.
Local repo is staging only.
No large quoted python -c blocks for file writes.
Use cat > file + Ctrl+D for safe handoff updates.

END OF HANDOFF
