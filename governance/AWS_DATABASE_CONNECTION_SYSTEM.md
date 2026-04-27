# AWS DATABASE CONNECTION SYSTEM (LOCKED)

## PURPOSE
This file governs ALL database connectivity behavior for Jarvis Prime.

## CURRENT STATE (LOCKED)
- Database: AWS RDS PostgreSQL
- Hostname: jarvis-db.cqhi66e4s20m.us-east-1.rds.amazonaws.com
- Issue: Hostname connection fails from local environment (Prisma P1001)
- Root Cause: Network/DNS/IPv6 resolution behavior (environment-specific)

## ENFORCED CONNECTION RULE (LOCAL DEV)
DATABASE_URL MUST use IPv4 address:

100.52.38.208

Example:
postgresql://<user>:<password>@100.52.38.208:5432/<db>?sslmode=require

## SSL REQUIREMENT (MANDATORY)
All connections MUST include:
?sslmode=require

## VERIFIED WORKING STATE
Command:
npx prisma migrate status

Expected Result:
"Database schema is up to date"

## PROHIBITED ACTIONS
- DO NOT revert to hostname-based connection without verification
- DO NOT remove sslmode=require
- DO NOT assume hostname resolution is stable

## WHEN HOSTNAME CAN BE RESTORED
Only if ALL are true:
1. npx prisma migrate status succeeds using hostname
2. No P1001 errors occur
3. Verified across multiple runs

## FAILURE RECOVERY RULE
If Prisma P1001 occurs:
1. Check public IP
2. Check AWS security group
3. Revert to IPv4 connection immediately

## NOTE
This is a NETWORK PATH ISSUE, not:
- Prisma issue
- Migration issue
- Database availability issue

END

---

## 2026-04-27 ADDENDUM — LOCAL VS AWS DATABASE RUNTIME CLARIFICATION (LOCKED)

### Local Development Rule

Local development from E:\JARVIS continues to use the IPv4 DATABASE_URL rule:

- host/IP: 100.52.38.208
- sslmode=require
- database: jarvis_training_salesperson_registry

This remains the verified local Prisma path.

### AWS Runtime Rule

Production backend on EC2 runs from:

- /opt/jarvis-backend

Production backend must point to:

- database: jarvis_training_salesperson_registry

Production backend must NOT point to:

- jarvis_prod

### TLS Bypass Temporary Runtime

Current production backend still requires temporary runtime setting:

- NODE_TLS_REJECT_UNAUTHORIZED=0

This is a temporary production unblocker only.

Required future fix:

- install/configure AWS RDS trusted certificate chain
- remove NODE_TLS_REJECT_UNAUTHORIZED=0
- restart jarvis-backend with secure TLS validation

### Phase 5 Verification

As of 2026-04-27:

- Local Prisma migrate status confirmed database schema is up to date.
- No schema or migration files changed during RBAC / call completion / Phase 5 deployment work.
- No migrate deploy was required for this session.
- Production backend was deployed by code pull, TypeScript compile, and PM2 restart only.

### Public IP Clarification

The EC2 public IP is separate from the database IPv4 path.

Observed production EC2 public IP after stop/start:

- 100.28.220.208

This IP is for public web access / Route 53 only.
It does NOT replace the local DATABASE_URL IPv4 database host rule.

