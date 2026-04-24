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
