# JARVIS Bots

Automated health-check and drift-detection bots for the JARVIS monorepo.

## Quick Start

Run any bot from the repo root (`E:\JARVIS`):

```bash
npm run bot:sentinel   # Infra Sentinel — checks frontend, backend, auth, proxy
npm run bot:drift      # Schema + Contract Drift — scans API contract mismatches
npm run bot:triage     # Log Triage — parses logs for known error signatures
npm run bot:doctor     # Bot Doctor — runs all three in sequence, prints GO/NO-GO
```

## Bots

### Infra Sentinel (`bots/infra-sentinel/`)

Validates that frontend, backend, auth login, and the customers proxy are reachable and working.

```bash
npm run bot:sentinel
npm run bot:sentinel -- --baseUrl http://localhost:3001 --backendUrl http://127.0.0.1:3000
```

| Option           | Default                      |
|------------------|------------------------------|
| `--mode`         | `local`                      |
| `--baseUrl`      | `http://localhost:3000`      |
| `--backendUrl`   | `http://127.0.0.1:3002`     |
| `--demoEmail`    | `michael+demo@mw4h.com`     |
| `--demoPassword` | `Passw0rd!`                  |

Report: `bots/reports/infra-sentinel.json`

### Schema + Contract Drift Guardian (`bots/schema-drift-guardian/`)

Scans frontend for `/api/` endpoint usage and backend for NestJS routes, then compares them. Also runs legacy schema drift checks when a database is available.

```bash
npm run bot:drift
```

Report: `bots/reports/schema-drift-guardian.json`

### Log Triage + Fix Capsule Launcher (`bots/log-triage/`)

Parses log files for known error signatures and generates ready-to-paste Cursor fix prompts.

```bash
npm run bot:triage
npm run bot:triage -- --logFile path/to/error.log
```

| Option      | Default       |
|-------------|---------------|
| `--mode`    | `recommend`   |
| `--logFile` | (auto-discover) |
| `--lines`   | `5000`        |
| `--hours`   | `24`          |

Report: `bots/reports/log-triage.json`

### Bot Doctor (`bots/bot-doctor/`)

Conductor bot. Runs sentinel → drift → triage in sequence. Stops on the first NO-GO and prints the recommended next action.

```bash
npm run bot:doctor
```

Report: `bots/reports/bot-doctor.json`

### API Contract Auditor (`bots/api-contract-auditor/`)

Pre-existing bot that scans frontend API calls vs backend routes.

```bash
npm run audit:api
```

## Report Outputs

All JSON reports are written to `bots/reports/`:

| File                          | Producer            |
|-------------------------------|---------------------|
| `infra-sentinel.json`         | Infra Sentinel      |
| `schema-drift-guardian.json`  | Drift Guardian      |
| `log-triage.json`             | Log Triage          |
| `bot-doctor.json`             | Bot Doctor          |

## Exit Codes

- `0` — GO (all checks passed)
- `1` — NO-GO (failures detected; see report for details)
