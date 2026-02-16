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
Before wiring, diagnosing, or deploying:

- Windows/local: npm run audit:api
- EC2/Linux: run in order:
  1) npm run guardian:schema
  2) npm run sentinel:infra
  3) npm run log:triage

## Immediate Objective
Use Auditor backlog + guardrails to accelerate wiring without stalls.

---
## SESSION UPDATE (2026-02-15) - BuildBots + Customer Search Priority

### BuildBots installed (4 bots) - DISCOVERY PATHS
Bots live under: bots/

1) API Contract Auditor
   - Folder: bots/api-contract-auditor/
   - Run: npm run audit:api

2) Schema Drift Guardian
   - Folder: bots/schema-drift-guardian/
   - Run: npm run guardian:schema

3) Infra Sentinel
   - Folder: bots/infra-sentinel/
   - Run: npm run sentinel:infra

4) Log Triage Bot
   - Folder: bots/log-triage/
   - Run: npm run log:triage

Governance files relevant to bots (read-first):
- governance/BOT_STACK.md
- governance/BUILD_STATE.md
- governance/LOCKED_INVARIANTS.md
- governance/HANDOFF_CURRENT.md (this file)

### Guardrail execution discipline (platform-aware)
- Windows/local: audit:api is the primary local guardrail.
- EC2/Linux-only by nature: sentinel:infra, log:triage (expects Linux tools/logs).
- Schema Guardian is most stable when run where Prisma+DB tooling is already standardized (EC2).

### Immediate Next Build Objective (MUST START HERE)
Customer List: implement Search + Filters FIRST (before deeper customer wiring).

Customer list must scale to thousands of Customers/Prospects:
- Add Search input (debounced)
- Filters:
  - Type: All / Customer / Prospect
  - Salesperson
- Sorting scaffold (Name now; revenue-based sorts later)
- Design for server-side query params + pagination (do not rely on client-only filtering long-term)

Resume point:
- Packet 5 (Customer UI): wire /api/customers and build Search/Filters UI first.

### Repo state expectation
- Repo should remain clean after bot/tooling work; avoid BOM/encoding changes.
- Do NOT downgrade Node.
- Avoid experimental loaders unless explicitly approved.
