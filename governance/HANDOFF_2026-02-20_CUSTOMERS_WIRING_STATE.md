# 🔒 JARVIS PRIME — CANONICAL SYSTEM HANDOFF  
**Date:** 2026-02-20 (America/Chicago)  
**Branch (root + backend):** wip/customers-wiring-2026-02-17  
**Primary working drive:** E:\JARVIS  
**Backup drive:** D:\JARVIS (READ-ONLY — DO NOT EDIT)

---

# 1️⃣ SYSTEM STATE SUMMARY

We are actively wiring **Packet 5 — Customer Portal** (Customers Hub + Customer Detail + Contacts + Ownership).

The backend and frontend are both running locally and communicating successfully.

Major milestone achieved today:
✔ Customer Detail endpoint now returns full `contacts[]` array.
✔ Contacts confirmed live via Prisma and API test.
✔ Commits pushed to origin (root + backend repos).

Open issue:
⚠ Street addresses displaying as "not on file" in UI — requires DB verification.

---

# 2️⃣ LOCAL RUNTIME CONFIGURATION (VERIFIED)

## Frontend
- URL: http://localhost:3001
- Uses Next API proxy routes under `/api/*`

## Backend
- URL: http://127.0.0.1:3002
- Health endpoint: GET /readyz → {"ok": true}

## Authentication
POST http://127.0.0.1:3002/auth/login  
Demo credentials:
- michael+demo@mw4h.com
- TrainingPass123!

Tokens expire quickly — must re-login if receiving 401.

---

# 3️⃣ ROOT CAUSE FIXED TODAY

## Issue: Contacts Missing on Customer Detail

### Problem
`GET /customers/:id` (customers.service.ts → findOne)
- Selected only 1 contact (`take: 1`)
- Returned flattened phone fields only
- Did NOT return contacts array

### Fix Applied
- Removed `take: 1`
- Selected full contact fields
- Returned `contacts: customer.contacts ?? []`
- Rebuilt backend successfully
- Verified via live API call:
  - Contacts count: 9 (for customer 6f5d40aa-8fc3-4bde-9a92-ae303a184a6a)

Commit:
d268a7b — Customers: return contacts array on customer detail

---

# 4️⃣ REPOSITORY STRUCTURE CLARIFICATION

There are TWO repos:

## Root Repo
E:\JARVIS
Contains:
- Governance
- Frontend
- Import scripts
- Handoff docs

## Backend Repo
E:\JARVIS\02_backend
Contains:
- NestJS app
- Prisma schema
- Customers module

Confusion earlier was caused by checking backend git log while expecting root commits.

This is resolved.

---

# 5️⃣ CURRENT OPEN ISSUE — STREET ADDRESSES

Customer Detail UI shows:
- City/State present
- "Street address not on file"

We must determine which of the following is true:

A) Street data exists in DB but API does not return street1/street2  
B) Street data was never applied to jarvis_training  
C) Specific customer has no street data  

No schema changes were performed in this session.

---

# 6️⃣ REQUIRED FIRST ACTION NEXT SESSION (NO GUESSING)

Run this in backend folder:

cd E:\JARVIS\02_backend

node -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); (async()=>{ 
  const total = await p.customer.count();
  const withStreet = await p.customer.count({ where: { locations: { some: { street1: { not: null } } } } });
  console.log('Customers total:', total);
  console.log('Customers with street1:', withStreet);
  await p.$disconnect();
})().catch(e=>{console.error(e); process.exit(1);});"

Interpretation:
- If withStreet ≈ 50 → backend select is missing street fields
- If withStreet = 0 → import not applied to this runtime DB

No UI changes until this is confirmed.

---

# 7️⃣ PACKET STATUS

Packet 1 — Internal Orders: UI shells complete  
Packet 2 — Recruiting & Vetting: shell only  
Packet 3 — Employee My Work: shell only  
Packet 4 — Time Entry: UI working  
Packet 5 — Customer Portal: actively wiring  
Packet 6 — Money: untouched  
Packet 7 — Admin/Safety: functional  

Active focus: Packet 5 data correctness and full wiring integrity.

---

# 8️⃣ SAFETY RULES FOR NEXT SESSION

- DO NOT modify Prisma schema
- DO NOT run migrations
- DO NOT `git add .` in backend repo
- DO NOT guess about DB state
- Verify data before writing code

---

# END OF HANDOFF
