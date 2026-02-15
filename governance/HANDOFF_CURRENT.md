# HANDOFF_CURRENT — Jarvis Prime Session Continuity

## Build Environment
Primary Drive: E:\JARVIS
Infra: AWS EC2 + Nginx reverse proxy + PM2

## Active Runtime Ports (EC2)
| Service | Port |
|---------|------|
| Prod Backend | 3000 |
| Frontend | 3001 |
| Training Backend | 3002 |

## Guardrails (MANDATORY)
Before wiring, diagnosing, or deploying, run in order:

1) npm run audit:api
2) npm run guardian:schema
3) npm run sentinel:infra
4) npm run log:triage

## Immediate Objective
Use Auditor backlog + guardrails to accelerate wiring without stalls.
