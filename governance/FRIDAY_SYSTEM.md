# FRIDAY SYSTEM
**Status:** LOCKED GOVERNANCE  
**System:** Friday  
**Purpose:** Define the full architecture, data flow, and operating model of the Friday system so all future build work is deterministic, company-first, and aligned with Jarvis Prime.

---

## 1. Purpose

Friday is the **Sales Intelligence and Execution System** inside Jarvis Prime.

Its purpose is to:
- identify and prioritize target companies
- provide structured call workflows for sales reps
- enable real-time execution during calls (via Execution Panel)
- capture and persist sales intelligence into Jarvis
- compress the time between first contact and revenue-generating action

Friday is not a traditional CRM.  
Friday is a **company-first targeting and execution engine**.

---

## 2. Core Philosophy

Friday is built on the following principles:

### 2.1 Company-First Selling
The primary unit of focus is:
- the **company**, not the individual contact

Contacts exist within companies, but targeting, scoring, and prioritization begin at the company level.

---

### 2.2 Pre-Call Intelligence > Post-Call Cleanup
Friday prioritizes:
- selecting the right companies to call
- preparing reps with context before dialing

Not:
- cleaning up notes after the fact

---

### 2.3 Execute During the Call
Friday integrates:
- pricing
- recap
- quote
- MSA

directly into the call flow via the **Friday Execution Panel**.

---

### 2.4 No Duplicate Systems
Friday must not recreate:
- CRM logic
- quote system logic
- burden/pricing logic
- contract system logic

It orchestrates these systems, it does not replace them.

---

## 3. System Components

Friday consists of the following major components:

1. **Data Ingestion Layer**
2. **Company Targeting Layer**
3. **Scoring & Prioritization Engine**
4. **Rep Work Queue**
5. **Call Session System**
6. **Friday Execution Panel (governed separately)**
7. **Data Persistence & Feedback Loop**

---

## 4. Data Ingestion Layer

### 4.1 Supported ingestion methods

Friday must support:

- **File Uploads**
  - ZoomInfo exports
  - call lists
  - CSV/XLS imports

- **API Integrations (future/expandable)**
  - ZoomInfo API
  - other data providers

- **Manual Entry**
  - rep-entered companies
  - targeted accounts identified by sales staff

---

### 4.2 Ingestion rule

All ingestion paths must normalize into a consistent **Company object**.

---

### 4.3 Deduplication requirement

The system must avoid creating duplicate companies.

Matching should consider:
- company name
- domain (if available)
- location context

---

## 5. Core Data Model (High-Level)

### 5.1 Company (Primary Object)
Represents the business being targeted.

May include:
- name
- industry (SIC/NAICS)
- locations
- status (lead / prospect / customer)
- known relationships
- historical interactions

---

### 5.2 Contact
Represents individuals within a company.

Must be:
- attached to a company
- not treated as standalone primary targets

---

### 5.3 Call Target
A structured record representing:
- a company selected for outreach
- optionally tied to a specific contact

---

### 5.4 Call Event
Represents:
- a single call session
- recording
- transcript
- actions taken during the call

---

### 5.5 Activity / Timeline
Tracks:
- calls
- emails
- quotes
- MSA sends
- notes

---

## 6. Company Targeting Layer

### 6.1 Purpose
To define which companies should be called and why.

---

### 6.2 Industry targeting (future-critical)
Friday should support identifying high-converting industries using:
- SIC codes
- NAICS codes

This will later influence scoring and prioritization.

---

### 6.3 Target definition
A “target” is:
- a company selected for outreach based on criteria
- not just any company in the database

---

## 7. Scoring & Prioritization Engine

### 7.1 Purpose
Friday must rank companies before reps call them.

---

### 7.2 Key idea
Reps should not decide randomly who to call.

The system should:
- surface highest-value opportunities first

---

### 7.3 Example scoring inputs (future expansion)
- industry fit
- location relevance
- project signals
- past interactions
- recency
- responsiveness
- data completeness

---

### 7.4 Output
A ranked list of companies for outreach.

---

## 8. Rep Work Queue

### 8.1 Purpose
Provide reps with a structured, prioritized list of who to call.

---

### 8.2 Behavior
The queue should:
- present companies (not just contacts)
- optionally suggest contacts within the company
- allow rep-driven selection when needed
- allow assignment or self-pull models (future decision)

---

### 8.3 Prohibition
Do not reduce the queue to a flat contact dial list.

---

## 9. Call Session System

### 9.1 Requirement
Calls must occur inside Jarvis/Friday.

---

### 9.2 Capabilities
Each call session should support:
- dialing
- call recording
- transcript generation
- association with company/contact
- linkage to actions performed

---

### 9.3 Call as system object
A call is a **first-class object**, not just a log entry.

---

## 10. Friday Execution Panel (Reference)

The Friday Execution Panel is governed separately in:

- `FRIDAY_EXECUTION_PANEL.md`

---

### 10.1 Role within system
It is the **real-time execution layer during the call**, responsible for:
- pricing (Quick Price)
- recap emails
- formal quote launch
- MSA send

---

### 10.2 Boundary
The Execution Panel:
- initiates actions
- does not own system-of-record data for quotes, contracts, or customers

---

## 11. Data Persistence & Feedback Loop

### 11.1 Purpose
Ensure all call intelligence feeds back into Jarvis.

---

### 11.2 Required behavior
After or during a call, the system must persist:
- company updates
- contact details
- call records
- transcripts
- pricing discussions
- actions taken (emails, quotes, MSAs)

---

### 11.3 Feedback loop
Captured data should improve:
- targeting
- scoring
- rep efficiency over time

---

## 12. Relationship to Jarvis Core Systems

Friday must integrate with, but not replace:

### 12.1 Customer / Company System
- owns company records

### 12.2 Contact System
- owns contact records

### 12.3 Quote System
- owns formal quotes

### 12.4 Burden / Financial Engine
- owns pricing math

### 12.5 Contract / MSA System
- owns agreements and signature tracking

---

## 13. Non-Goals / Prohibitions

### 13.1 No CRM duplication
Do not rebuild a full CRM inside Friday.

---

### 13.2 No contact-first design
Do not structure Friday as a contact dialing tool.

---

### 13.3 No random call lists
Do not allow unstructured calling without prioritization.

---

### 13.4 No shadow data models
Do not create parallel company/contact systems.

---

### 13.5 No financial logic duplication
Do not reimplement burden or pricing logic inside Friday.

---

## 14. Build Philosophy

Friday should be built as:

- a **targeting system**
- a **prioritization engine**
- a **call execution environment**
- a **data capture system**

It should:
- guide reps to the right companies
- support them during the call
- capture everything that matters
- feed Jarvis for downstream systems

---

## 15. Future Expansion Notes

Planned expansions include:
- advanced scoring models
- industry conversion analytics
- rep performance insights
- AI-assisted call coaching
- automated follow-up scheduling
- deeper integration with recruiting and dispatch

---

## 16. Final Lock Summary

The following decisions are locked:

- Friday is a **company-first system**
- Friday is not a traditional CRM
- Friday supports:
  - file ingestion
  - API ingestion
  - manual entry
- Companies are the primary targeting unit
- Contacts are secondary and attached to companies
- Friday includes a scoring/prioritization engine
- Reps work from a prioritized company queue
- Calls occur inside Jarvis and are first-class objects
- The Execution Panel is a governed subsystem
- Friday integrates with, but does not replace:
  - Quotes
  - Burden
  - Customers
  - Contacts
  - Contracts
- All call intelligence must persist into Jarvis

---
**End of governance file**

## 2026-04-13 ADDENDUM — OWNED-FIRST / UNOWNED-LEAD FALLBACK (LOCKED)

The Friday queue model is locked as a two-layer system:

1. OWNED WORK REMAINS PRIMARY
   - Existing owned/prospect/customer work for the rep remains the first priority layer.
   - This includes overdue follow-ups, due-today follow-ups, stale owned accounts/customers that require contact, and other owned callable work already governed by Friday.
   - This owned path is NOT removed or replaced.

2. UNOWNED LEADS ARE GAP FILLER / FALLBACK
   - Unowned leads from ZoomInfo, spreadsheets, resumes, manual entry, and other lead sources must be eligible to enter Friday call flow without pre-existing ownership.
   - Unowned leads are a fallback layer beneath owned work.
   - They are served only when there is no OWNED WORK THAT IS CALLABLE NOW.

3. CALLABLE-NOW GATE
   - The gate is NOT "owned work exists."
   - The gate IS "owned work is callable now."
   - Future-scheduled owned work later in the day does NOT block unowned lead fallback before that time arrives.
   - Owned overdue work, owned due-now work, and other owned callable-now work continue to outrank leads.

4. OWNERSHIP CREATION POINT
   - Unowned leads do NOT start with ownership.
   - Ownership is created only after meaningful/progressing engagement through existing control logic.
   - Only then does the record transition into Friday prospect/control enforcement (11-day / 55-day clocks, etc.).

5. ENFORCEMENT / CONTROL PRESERVATION
   - Phase 9 enforcement logic remains intact.
   - Phase 10 control panel logic remains intact.
   - This change is additive beneath the existing owned-work engine and does not weaken enforcement.

6. CUSTOMER / PROSPECT / LEAD ALIGNMENT
   - Customer.lifecycleStatus / CompanyLifecycleStatus remains the canonical lifecycle classification for LEAD / PROSPECT / CUSTOMER.
   - Friday intake must respect that classification, while preserving owned-work priority and stale-customer call behavior.

7. CURRENT STATUS
   - FRIDAY 9.1 correction is fixed in code and build-validated.
   - Live lead runtime verification is still pending until real lead data is available in the system.


## 2026-04-15 ADDENDUM — PHASE 11A ZOOMINFO INTEGRATION RULES (LOCKED)

1. ZoomInfo integration uses Legacy Enterprise API ONLY.
2. This codebase uses native fetch (NOT Axios).
3. Native fetch returns JSON directly (no extra response.data layer).
4. Enrich base path is res.data.result.
5. Result items are wrapper objects; actual company data is inside result[].data[].
6. Extraction must unwrap result[].data[] and ignore invalid structures safely.
7. primaryIndustry may be string OR string[]; normalization must handle both.
8. No contact ingestion. No ownership assignment. Lifecycle = LEAD on create.
9. Dedup: ZoomInfo ID → domain → name+state. Re-pull updates only.
10. No silent scope expansion in correction builds.


## 2026-04-16 ADDENDUM � PHASE 11B LIVE CAMPAIGN OPERATING STATUS (LOCKED)

1. Phase 11B campaign pipeline is now live-operational in its no-state form.
2. Live validated path: Campaign -> ZoomInfo -> Customer -> CampaignMember STAGED.
3. Live verified result observed: 25 found / 23 created / 23 members staged.
4. Campaign UI is now readable enough for real operation and exposes create, activate, pull, refill, detail, promote, and reject actions.
5. Employee range translation to ZoomInfo legacy employeeCount buckets is locked as required behavior.
6. ZoomInfo outbound request hardening is locked: diagnostics, single retry, timeout handling.
7. Current known limitation: legacy ZoomInfo /search/company rejects locationState in the current campaign-search path.
8. Operating rule until later fix: use campaign pulls without state filtering.
9. This limitation does not invalidate the campaign pipeline; it narrows the currently safe operating envelope.


## 2026-04-17 ADDENDUM � PHASE 11C COMPLETE (LOCKED)

1. Phase 11C is complete and runtime-validated.
2. Campaign-created companies move through:
   - STAGED
   - READY_FOR_PROMOTION
   - PROMOTED
3. Promotion must synchronize the linked Customer lifecycle:
   - null / undefined / missing -> LEAD
   - LEAD -> unchanged
   - PROSPECT -> unchanged
   - CUSTOMER -> unchanged
4. CampaignMember remains tracking layer only; Customer remains canonical system-of-record.
5. Promoted campaign leads must become queue-eligible through Customer lifecycle, not through a parallel queue object.
6. Customer.phone is the authoritative first-touch dial path for campaign-created leads.
7. Named contacts are optional and not required.
8. Contact-level phone may be used only as fallback when Customer.phone is unavailable or when a human explicitly chooses a contact later.
9. No paid ZoomInfo contact data is required for campaign-created lead calling.
10. Phase 11C was runtime-validated end-to-end:
    Campaign -> STAGED -> PROMOTED -> Customer.lifecycleStatus=LEAD -> Intelligence Queue -> Call Session -> Customer.phone.

## 2026-04-18 ADDENDUM � CALL COMPLETION MODEL (LOCKED)

Friday now uses a locked two-step call completion model for the rep-facing call flow:

1. Outcome
2. CTA

This applies inside one completion modal and separates:
- what happened
- what happens next

### Context Rule
The rep-facing completion flow now includes bounded operational context:
- note history
- call history
- active follow-up
- attempt count

### Lead Activity Language Rule
LEAD call history must use activity language only:
- Last called by
- Last rep who touched this record

LEADs do not gain ownership semantics from this display.

### Intent
This change strengthens rep clarity, reduces duplicated completion actions, and keeps Friday aligned with its company-first execution model.


=== 2026-04-18 CALL COMPLETION LOCK (FINAL) ===
Call completion two-step model locked.


----------------------------------------------------------------

## 2026-04-19 ADDENDUM - PHASE 13 ROUTING CONTRACT NORMALIZATION (LOCKED)

The Friday system routing contract is now explicitly locked as:

- Browser requests use /api/*
- Next route handlers receive /api/*
- Frontend proxy forwards to backend /*
- Backend controllers must NOT include api/ in @Controller() prefixes

Normalized in this session:
- Friday backend controllers
- Campaigns backend controller
- ZoomInfo backend controller
- All affected frontend proxy backendPath strings

Final contract:
Browser -> /api/*
Next route handlers -> /api/*
Proxy -> backend /*
Backend controllers -> /*

This resolves the prior mixed-contract drift where some controllers expected api/ and others did not.

----------------------------------------------------------------

## 2026-04-19 ADDENDUM - PHASE 13 EXECUTION CLARITY + DEFER CONTROL (LOCKED)

Phase 13 is complete.

Locked outcomes:
- Call Session no longer returns invalid/null-phone targets
- queue and execution truth are aligned
- empty state messaging is controlled and minimal
- local-time callability uses zip-first with state fallback
- reps can defer the current system-assigned target using preset or custom time
- defer reuses the existing Phase 6 follow-up system and conflict rules
- successful defer advances the session to the next target or clean empty state

This phase is complete and should be treated as the final operational stability layer before Phase 14.

----------------------------------------------------------------
