# Jarvis Data Model — MW4H v1 (Single-tenant)

This document defines the core entities (tables/collections) and how they relate.
Goal: a clean, auditable, status-driven system with consent-based compliance.

---

## Core Entities (v1)

### 1) Company
Represents a contractor/customer company.
Key fields:
- id
- name
- billing_address (optional)
- status (Active / Inactive)
- tags/markers (SIC/NAICS, trade focus: millwrights, crane, electrical, etc.)
- created_at, updated_at

Relationships:
- Company has many Contacts
- Company has many Orders
- Company has many JobSites (optional v1)

---

### 2) Contact
A person at a Company (PM, Superintendent, Procurement, Safety, etc.)
Key fields:
- id
- company_id
- first_name, last_name
- title/role
- phone(s), email(s)
- preferred_contact_method
- notes
- created_at, updated_at

Sales activity fields (stored at contact level):
- last_called_at
- last_30_days_called_flag (derived)
- call_history_count (derived)

Relationships:
- Contact has many CallLogs
- Contact may be linked to Orders (requested_by, approver, etc.)

---

### 3) CallLog
Tracks outbound/inbound activity (future: recordings + transcripts).
Key fields:
- id
- contact_id
- company_id (denormalized convenience)
- direction (Outbound/Inbound)
- outcome (No answer / VM / Connected / Follow-up set / Not a fit)
- notes
- recording_url (optional)
- follow_up_at (optional)
- created_by_user_id
- created_at

---

### 4) Order
A request for labor (customer-facing object).
Key fields:
- id
- company_id
- job_site_id (optional v1)
- created_by_user_id
- requested_by_contact_id (optional)
- approved_by_contact_id (optional)
- status:
  - Draft
  - SentForCustomerReview
  - CustomerApproved
  - NeedsToBeFilled
  - Filled
  - InProgress (optional)
  - Completed
  - Closed
- customer_notes (editable during review)
- internal_notes
- start_date, expected_end_date (optional)
- created_at, updated_at

Relationships:
- Order has many OrderPositions
- Order has many Assignments
- Order has many TimeEntries (weekly hours tied to order/assignment)

---

### 5) OrderPosition
Each Order can have one or multiple positions (trade + qty).
Key fields:
- id
- order_id
- trade (Millwright / Welder / Rigger / Crane Op / Electrician / etc.)
- quantity_needed
- required_markers (skills/tools/PPE/certs)
- pay_rate (optional)
- bill_rate (optional)
- status (Open / Filled / Cancelled)
- created_at, updated_at

Relationships:
- OrderPosition has many CandidateRecommendations (generated)
- OrderPosition ties to Assignments (one assignment per filled seat)

---

### 6) Worker (Employee/Candidate)
The worker profile + history.
Key fields:
- id
- first_name, last_name
- phone, email
- status:
  - Applicant
  - ActiveSeeking
  - NotActive
  - Dispatched
  - OnAssignment
  - Inactive
- trades (multi)
- skills/certs (multi)
- tools_checklist (multi)
- ppe_checklist (multi)
- safety_score (derived/optional)
- created_at, updated_at

Relationships:
- Worker has many Consents
- Worker has many ComplianceCompletions
- Worker has many Assignments
- Worker has many SafetyEvents
- Worker has many TimeEntries

---

### 7) Consent
Explicit consent logs for compliance/tracking.
Key fields:
- id
- worker_id
- consent_type:
  - LocationCheckIn
  - VideoCompliance
  - CommunicationSMS
- disclosure_text_version
- granted (true/false)
- granted_at
- revoked_at (optional)
- captured_by (WorkerSelf / Recruiter)
- created_at

Rules:
- Dispatch requires LocationCheckIn + VideoCompliance consent granted (if those features are used).

---

### 8) ComplianceItem
Defines required compliance items (videos/quizzes).
Key fields:
- id
- type (Video / Quiz / DocAck)
- name
- url
- scope:
  - GeneralMW4H
  - SiteSpecific
  - DailySafety
- active (true/false)

---

### 9) ComplianceCompletion
Tracks worker completion of compliance items.
Key fields:
- id
- worker_id
- compliance_item_id
- order_id (optional, for site-specific)
- completed_at
- score (optional)
- verified (true/false)
- verification_notes (optional)

Dispatch lock depends on required completions.

---

### 10) Assignment
Connects a Worker to an Order/Position (the actual placement).
Key fields:
- id
- order_id
- order_position_id
- worker_id
- status:
  - Proposed
  - Dispatched
  - OnAssignment
  - Completed
- dispatched_at (optional)
- arrived_at (optional)
- completed_at (optional)
- arrival_verification_method (Geofence / OneTap)
- arrival_verified (true/false)
- created_at, updated_at

---

### 11) JobSite (optional v1, recommended)
A job location tied to an Order.
Key fields:
- id
- company_id
- name
- address
- geofence (optional; later)
- safety_video_links (optional)
- created_at, updated_at

---

### 12) SafetyEvent
Safety history entries (marker + reporting).
Key fields:
- id
- worker_id
- company_id
- job_site_id (optional)
- order_id (optional)
- assignment_id (optional)
- type (Violation / NearMiss / Recordable)
- severity (Low/Med/High)
- occurred_at
- notes
- created_by_user_id
- resolved_at (optional)

---

### 13) TimeEntry (Hours)
Weekly hours tied to an Order/Assignment.
Key fields:
- id
- week_ending_date
- company_id
- order_id
- assignment_id
- worker_id
- entered_by (Customer / MW4H / Worker)
- hours_regular
- hours_ot
- approved (true/false)
- approved_at (optional)
- exported_to_quickbooks_at (optional)

---

## AI/Matching Entities (v1 minimal)

### CandidateRecommendation
Key fields:
- id
- order_position_id
- worker_id
- rank_score
- reasons (markers matched/missing)
- created_at

---

## Minimal Relationships (at a glance)
Company -> Contacts, Orders, JobSites
Contact -> CallLogs
Order -> OrderPositions, Assignments, TimeEntries
OrderPosition -> Assignments, CandidateRecommendations
Worker -> Assignments, TimeEntries, Consents, ComplianceCompletions, SafetyEvents
Assignment -> TimeEntries (optional direct link)
