# BOT_STACK — Jarvis Prime BuildBot Stack (LOCKED)

These internal bots live inside the Jarvis Prime repo and must be used as guardrails during wiring, deploy, and diagnostics.

## 1) API Contract Auditor
Command:
    npm run audit:api
Purpose:
Detects mismatches between frontend API calls and backend NestJS routes (missing endpoints, method mismatches, contract gaps).

## 2) Schema Drift Guardian
Command:
    npm run guardian:schema
Purpose:
Compares Prisma schema vs live DB schemas across environments (missing tables/columns, enum/type drift, env schema misalignment).

## 3) Env / Infra Sentinel
Command:
    npm run sentinel:infra
Purpose:
Runtime infra inspection (listeners, PM2 status, /api proxy routing, backend health, env identity/DB segregation, nginx presence).

## 4) Log Triage Bot
Command:
    npm run log:triage
Purpose:
Fingerprints and ranks runtime errors (new vs known, severity clustering) so you stop spelunking logs.

## Guardrail Execution Order (MANDATORY)
Before wiring or deployment actions:
1) npm run audit:api
2) npm run guardian:schema
3) npm run sentinel:infra
4) npm run log:triage

No build action should proceed if HIGH severity findings exist.
