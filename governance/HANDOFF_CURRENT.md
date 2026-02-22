# 🔒 JARVIS PRIME — FULL SYSTEM HANDOFF

**Date:** 2026-02-21
**Branch:** `wip/customers-wiring-2026-02-17`
**Primary Drive:** `E:\JARVIS` (D: is backup only)
**Local Ports (expected):** Frontend `3000` (Next), Backend `3002` (Nest)
**Auth model:** Frontend `/api/*` proxies to backend and forwards `Authorization` header; backend endpoints require JWT (401 expected when backend down or no token).

---

## ✅ What We Accomplished Today

### 1) Verified ownership wiring end-to-end (no guesses)

We confirmed the Customer Ownership page is **registry-driven**:

* **Dropdown source:** `GET /salespeople` returns Salesperson registry records with `{ id, firstName, lastName, email, isActive, userId }`.
* **Save endpoint:** `PATCH /customers/:id/default-salesperson` with payload `{ salespersonId: <Salesperson.id> }`.
* **Backend behavior:** maps registry → user:

  * Writes `Customer.defaultSalespersonId = Salesperson.id`
  * Writes `Customer.defaultSalespersonUserId = Salesperson.userId (or null)`
* **Hub display:** shows `defaultSalesperson` object mapped from `defaultSalespersonRegistry` relation (registry join), not from User.

### 2) Resolved a real schema drift situation (cleanly + safely)

We found the backend/service code and migrations expected `defaultSalespersonId` + registry relation, but the committed `prisma/schema.prisma` did not include it (drift).

Actions taken:

* Avoided Prisma version drift (kept Prisma Client v7.2.0; ignored update prompt).
* Ran `prisma db pull` only to **confirm DB truth** (training DB had the field), but **did not commit** the introspected churn.
* Performed **surgical schema fix** and regenerated Prisma client.
* Committed and pushed schema alignment (backend repo).

**Backend commit (schema alignment):**

* `Schema: align Customer with DB (defaultSalespersonId + registry relation)`
* SHA: `d769c5b` (backend repo)

### 3) Backend: implemented Customer Hub query enhancements

**Goal:** allow Customer Hub to filter correctly by registry ownership and search by contact name.

Changes:

* `/customers` search now matches:

  * `Customer.name`
  * `Location.city`
  * `Location.state`
  * `CustomerContact.firstName` and `lastName` (only `isActive: true`)
* Salesperson filter corrected to use:

  * `defaultSalespersonId` (registry id), not `defaultSalespersonUserId`

**Backend commit (customers query enhancements):**

* `Customers: search includes active contacts + filter by defaultSalespersonId`
* SHA: `d9dbf39` (backend repo)

### 4) Frontend: Customer Hub UI filters wired (inline)

**File changed:** `03_frontend/app/customers/page.tsx`

Added:

* Inline **Salesperson** dropdown (loads from `/salespeople`, filters `isActive`, sorts A–Z, value = registry `Salesperson.id`)
* Inline **State** dropdown (static 50-state list, value = 2-letter code)
* When filters change (salesperson/state/search), pagination resets to page 1
* Customers request now includes query params:

  * `salespersonId=<Salesperson.id>` (registry)
  * `state=<STATE_CODE>`
  * `search=<text>` (existing, now expanded backend-side)

**Frontend commit:**

* `Customers Hub: add salesperson + state filters`
* SHA: `6988732` (jarvis main repo)

### 5) Operational fix: login issues were caused by backend not running

Symptoms:

* `ECONNREFUSED 127.0.0.1:3002` from Next `/api/*` routes
* 500s on `/api/auth/login`, `/api/customers`, `/api/salespeople`

Resolution:

* Start backend (`npm run start:dev`) so proxies can connect
* After backend was up, login worked and hub sorting/filtering behaved correctly

**Current state:** Michael confirmed login works and the sort feature behaves as desired.

---

## ✅ Current Behavior Confirmed Working

* Can log in
* Customer Hub list loads
* Sort works as expected
* Salesperson filter works using registry ownership
* State filter works
* Global search now can find customers by **contact first/last name** (active contacts)

---

# Session Handoff Lock Summary

* Salesperson filtering and display in Customer Hub must be based on **Salesperson registry ID** (`defaultSalespersonId`).
* Search must include **active contacts**.
* Avoid Prisma version drift; run Prisma commands from `E:\JARVIS\02_backend`.
* If `/api/*` endpoints error with ECONNREFUSED, backend is not running; start it.

---

# 🔒 JARVIS PRIME — HANDOFF UPDATE (POST 2B.2 + 3A.1)

**Update Date:** 2026-02-21  
**Branch (frontend):** `wip/customers-wiring-2026-02-17`  
**Branch (backend):** `wip/customers-wiring-2026-02-17`  
**Primary Drive:** `E:\JARVIS`  
**Auth:** JWT in `localStorage` key `jp_accessToken`  
**Frontend API strategy:** same-origin `/api/*` proxies → backend

## ✅ CHANGES COMPLETED SINCE PRIOR HANDOFF

### 2B.2 — Customer PPE Tab Persistence Wiring (Hardened + UX fixes) ✅

**Frontend file updated:**
- `03_frontend/app/customers/[id]/page.tsx`

**Status:**
- Customer PPE tab is now fully persistence-ready and hardened:
  - Inline error handling (no silent failures)
  - In-flight saving state + disabled buttons + "Saving…" / "Deleting…" labels
  - Defensive label fallback: `Unknown PPE (ID: ...)`
  - Requirement ID normalization: `(row.id ?? row.reqId)`
  - Removed stale "UI only (no persistence)" delete copy

**Commit:**
- `99f77b9` — `Customer PPE: wire tab to persistence via /api proxy (2B.2)`

**Expected behavior:**
- Add/Edit/Delete customer PPE persists across refresh.
- UI uses PPE dictionary names (registry-backed), notes-only editing.

---

### 3A.1 — Order New PPE Blow-Through Defaults (Customer Policy → Order) ✅

**Frontend file updated:**
- `03_frontend/app/customers/[id]/orders/new/page.tsx`

**Status:**
- Order New now defaults PPE selections from Customer PPE policy:
  - Fetches `GET /api/customers/:id/ppe-requirements`
  - Extracts `ppeTypeId[]` and initializes `jobRequirements.ppe` once
  - One-shot flag prevents re-overwriting user edits after initialization
  - User can freely add/remove PPE per order (hybrid override preserved)
  - If reopening a draft path (orderId/sessionStorage), blow-through is skipped

**Commit:**
- `6b738aa` — `Order New: default PPE from Customer policy (3A.1 blow-through)`

**Expected behavior:**
- Customer → Orders → New:
  - PPE checkboxes pre-selected based on saved customer policy.
  - User can modify without it snapping back.

---

## ⚠️ GOVERNANCE NOTE (IMPORTANT)
- Cursor Agent reported that `E:\JARVIS\governance\00_READ_FIRST.md` and `E:\JARVIS\governance\NO_DRIFT.md` were NOT present at that path during execution.
- `E:\JARVIS\governance\HANDOFF_CURRENT.md` was present and read/updated.
- Future capsules should reference only governance files that actually exist at their real paths to avoid invalid preconditions.

## ✅ CURRENT PPE STACK STATUS (LAYER MODEL)
- Layer 1 (Registry — PPE Types): ✅ Complete
- Layer 2 (Customer Policy — persisted requirements): ✅ Complete / hardened
- Layer 3 (Order Override — default from policy, editable per order): ✅ Complete

## NEXT OPTIONS (NOT STARTED)
- Confirm UX with 2–3 real customers (quick manual verification)
- Move to next Packet/Slice per Michael's priority order (no action taken yet)
