# 🔒 JARVIS PRIME — FULL CANONICAL SYSTEM HANDOFF

**Date:** 2026-02-20 (America/Chicago)
**Branch:** `wip/customers-wiring-2026-02-17`
**Primary Drive:** `E:\JARVIS` (D:\JARVIS is backup only)
**Latest Commit:** `e9c7949`
**Status:** Clean, pushed, synchronized

---

# 1️⃣ Current System Stability

### Frontend

* Next.js dev: `http://localhost:3001`
* Proxy routes active under `/api/*`
* Customer Hub wired
* Customer Detail wired
* Contacts rendering from backend
* Street address rendering from `locations[0].address1`
* No fallback "Street address not on file" for valid records
* Working in logged-out demo mode (banner still visible)

### Backend

* NestJS: `http://127.0.0.1:3002`
* `/readyz` → OK
* `GET /customers` → envelope Option B
* `GET /customers/:id` → returns:

  * defaultSalesperson
  * contacts[]
  * locations[]
* Training DB confirmed
* No schema changes today
* No drift

### Git

* Root repo clean
* Backend repo clean
* No uncommitted tracked changes
* Only intentional file modified in last commit
* Remote branch synced

System is stable.

---

# 2️⃣ What Was Completed This Session

### ✅ Customer Contacts Wiring

Backend:

* `findOne()` now returns full `contacts[]`

Frontend:

* Customer detail consumes contacts array

### ✅ Street Address Wiring

Backend:

* Already returning `locations[]`

Frontend:

* Patched `headerStreetAddress` to read:
* Verified with All Things Metal
* Committed & pushed

### ❌ No Schema Drift

No Prisma changes.
No migration changes.
No DB writes during this fix.

---

# 3️⃣ Immediate Next Build Plan

We will proceed in controlled sequence:

---

## 🔹 STEP 1 — Remove Logged-Out Demo Banner (Low Risk UI Adjustment)

Goal:

* Remove or conditionally suppress the "You are viewing Jarvis Prime in logged-out demo mode" banner.

Rules:

* UI-only change
* No backend edits
* No auth logic changes
* No schema changes

Execution Method:

* Use Cursor Agent (Opus 4.6)
* Use 5.2 planning model to create surgical patch
* Single file modification only
* Commit isolated

---

## 🔹 STEP 2 — Fully Wire Customer Contacts (Create + Edit)

Current state:

* Contacts display
* Backend supports contacts
* UI likely shell for edit/create

Objective:

* Add full Create Contact flow
* Add full Edit Contact flow
* Ensure:

* Backend route exists
* DTO validation
* UI state binding
* Success refresh
* No mock fallback
* No demo bleed

Rules:

* No schema change unless explicitly required
* No silent API contract changes
* Use envelope conventions
* No breaking findAll/findOne shape

Execution method:

* Planning via ChatGPT 5.2
* Code generation via Opus 4.6
* Governance-first capsule
* Mandatory ACK block

---

# 4️⃣ Bot Enforcement Plan (Do This Correctly)

Before any build step:

### Run Guardian Checks (Conceptual Order)

1. Schema Drift Guardian
2. API Contract Auditor
3. UI ↔ Schema Drift Bot
4. Infra Sentinel (local only)
5. Log Triage

We will explicitly require Opus to:

* Confirm no schema drift
* Confirm no unintended file modifications
* Confirm commit isolation

---

# 5️⃣ Packet Status

### Packet 5 — Customer Portal (ACTIVE)

Completed:

* Customer list wiring
* Ownership wiring
* Contacts read
* Location read
* Street display fix

Pending:

* Contact create
* Contact edit
* Contact delete validation
* Approval package wiring
* Internal toggle persistence

---

### Packet 6 — Money (Not Started)

Untouched.

---

# 6️⃣ Known Environment Notes

* Next.js warning about multiple lockfiles (non-blocking)
* Windows CRLF warnings (non-blocking)
* Training DB confirmed
* No evidence of database switching during this session
* No ghost commits
* No uncommitted tracked changes

---

# 7️⃣ Hard Rules For Next Build

1. No `git add .`
2. No backend schema edits
3. No multi-file regex patching
4. No duplicate return keys
5. No silent envelope shape changes
6. One surgical change per commit
7. Commit message must describe exact scope

---

# 8️⃣ First Action In Next Session

We will begin with:

> Remove logged-out demo banner via surgical UI patch.

Then:

> Wire Customer Contacts Create/Edit fully.

Then pause and re-evaluate Packet movement.

---

# 9️⃣ Current System Health Assessment

This is the first time in several hours that:

* DB confirmed correct
* Backend confirmed correct
* Frontend confirmed correct
* Git confirmed clean
* Branch confirmed synced
* UI verified visually
* No runtime errors
* No schema instability

This is a clean architectural checkpoint.
