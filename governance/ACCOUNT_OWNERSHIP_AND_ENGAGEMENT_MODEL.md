# 🔒 ACCOUNT OWNERSHIP & ENGAGEMENT MODEL
## Jarvis Prime – Sales Governance Architecture (Locked Doctrine)

**Status:** APPROVED  
**Implementation Phase:** Deferred (Friday / Sales Engine Packet)  
**Durations:** To Be Configurable (Not Locked at This Time)  

---

# 1️⃣ PURPOSE

This document defines the permanent architectural rules governing:

- Account Ownership
- Engagement Windows
- Call Participation
- Status Behavior
- Call Engine Distribution Logic

Ownership and activity must never be conflated.

---

# 2️⃣ CORE CONCEPT SEPARATION

## A) Call Participation (Historical Only)

CallAttempt
- customerId
- repId
- timestamp
- result
- transcriptId

Call participation NEVER grants ownership.

---

## B) Engagement Window (Temporary Claim)

- engagedByRepId (nullable)
- engagementExpiresAt (nullable)
- engagementExtensionRequested (boolean)
- engagementExtensionApprovedBy (nullable)

Rules:

- Allowed only when status ≥ Lead
- Automatically expires
- Activity does NOT auto-extend
- Rep may request extension
- Manager approval required
- Expired engagement returns account to shared pool

Engagement ≠ Ownership.

---

## C) Account Ownership (Revenue-Based)

- accountOwnerId (nullable)

Rules:

- Ownership created only upon revenue event
- Revenue event includes:
  - Signed order
  - Invoice generation
  - Dispatch
- Ownership locked while status = Active
- Admin override allowed
- Ownership does NOT originate from call activity

Ownership follows revenue.

---

## D) Status

Approved statuses:

- Cold
- Lead
- Prospect
- Active
- Inactive
- Do Not Call

---

# 3️⃣ STATUS BEHAVIOR RULES

## Cold
- No ownership allowed
- No engagement lock
- Shared call pool
- Activity tracked only

## Lead
- Engagement window allowed
- Ownership not permanent
- Engagement auto-expires

## Prospect
- Engagement window allowed
- Ownership not permanent
- Engagement auto-expires
- Progression toward revenue expected

## Active
- Ownership locked
- Commission-bearing
- Removed from shared pool

## Inactive
- Ownership retained for historical record
- Eligible for reactivation engagement

## Do Not Call
- Removed from call engine
- Ownership irrelevant

---

# 4️⃣ ENGAGEMENT WINDOW GOVERNANCE

- Durations configurable later
- Engagement expiration is time-based
- Activity does NOT reset timer
- Extension requires management approval

---

# 5️⃣ REVENUE TRIGGERS

Ownership becomes permanent only when:

- Order is created
- Invoice is generated
- Job dispatch occurs

Signed MSA alone does NOT create permanent ownership.
Quote alone does NOT create permanent ownership.

Revenue event required.

---

# 6️⃣ CALL ENGINE BEHAVIOR

Friday Call Engine must:

- Pull Cold accounts from shared pool
- Respect active engagement windows
- Ignore ownership for Cold accounts
- Respect ownership only when status = Active

---

# 7️⃣ ADMIN AUTHORITY

Admin may:

- Override ownership
- Approve engagement extensions
- Reassign accounts
- Force status transitions

---

# 8️⃣ DESIGN PRINCIPLE

Prevent:
- Territory hoarding
- Timestamp gaming
- Artificial lock extension

Ownership must follow revenue.

---

**LOCKED BY ARCHITECT APPROVAL**