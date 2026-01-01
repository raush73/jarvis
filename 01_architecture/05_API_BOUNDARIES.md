# Jarvis API Boundaries — MW4H v1

Purpose: define clean module ownership and API boundaries before coding.

---

## Core Service Domains

### 1) Auth & Identity Service
Owns:
- Users (internal)
- Roles & permissions
- Session/token management

Does NOT own:
- Business data (orders, workers, hours)

---

### 2) CRM Service
Owns:
- Companies
- Contacts
- CallLogs
- Sales markers (SIC/NAICS, trade tags)

Exposes APIs:
- Create/update companies & contacts
- Log calls + outcomes
- Query “already called in last 30 days”

---

### 3) Order Management Service
Owns:
- Orders
- OrderPositions
- Order status transitions

Exposes APIs:
- Create order
- Send for customer review
- Approve order
- Transition to NeedsToBeFilled / Filled

Rules:
- Status transitions are validated server-side only

---

### 4) Recruiting & Matching Service
Owns:
- CandidateRecommendations
- Matching logic + markers
- Availability filtering

Consumes:
- Orders from Order Service
- Workers from Worker Service

Exposes APIs:
- Get ranked candidates for OrderPosition

---

### 5) Worker Service
Owns:
- Worker profiles
- Skills, tools, PPE
- Availability status

Exposes APIs:
- Update availability
- Retrieve worker summary for matching

---

### 6) Compliance & Safety Service
Owns:
- Consent
- ComplianceItems
- ComplianceCompletions
- SafetyEvents

Rules:
- Dispatch lock logic lives here
- No other service can bypass compliance checks

Exposes APIs:
- Verify dispatch eligibility
- Log compliance completion
- Retrieve safety summary

---

### 7) Dispatch & Assignment Service
Owns:
- Assignments
- Arrival verification
- Assignment lifecycle

Consumes:
- Compliance status
- Order + Worker data

Rules:
- Cannot dispatch unless Compliance Service approves

---

### 8) Time & Accounting Service
Owns:
- TimeEntries
- Approval status
- Export state

Exposes APIs:
- Submit hours
- Approve hours
- Export weekly hours (QuickBooks-ready)

---

### 9) Notification Service
Owns:
- SMS/email sends
- Templates
- Delivery logs

Consumes:
- Events from other services (order approved, dispatch ready, daily safety)

---

### 10) AI Orchestration Service
Owns:
- Prompt templates
- AI workflows
- Non-deterministic logic

Rules:
- AI never writes directly to core tables
- AI outputs suggestions only (humans or rules commit final state)

---

## Boundary Rules (Non-negotiable)
- No service writes to another service’s tables
- All state changes go through owning service APIs
- AI is advisory, never authoritative
- Compliance gates cannot be bypassed

