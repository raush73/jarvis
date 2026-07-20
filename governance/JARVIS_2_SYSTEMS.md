# JARVIS PRIME — FUTURE SYSTEMS (JARVIS 2.0)

Status: Future Architecture
Owner: Michael
Purpose: Capture architectural concepts intentionally deferred from Jarvis Prime 1.0 to prevent feature creep while preserving design direction.

Jarvis 1.0 focuses on the core economic engine, labor dispatch, compliance, and financial truth chain.

This document captures future systems that may be added in Jarvis 2.0.


# 1. Prevailing Wage Engine

Purpose

Support jobs governed by prevailing wage laws (Davis-Bacon, state prevailing wage rules, etc.).

Prevailing wage jobs behave differently from standard labor because:

- wages are split into base wage + fringe benefits
- overtime applies only to the base wage
- fringe benefits do not receive overtime premium
- burdens (FICA, FUTA, WC, etc.) generally still apply normally

Because of this structure, prevailing wage calculations should be handled by a separate economic engine path.


# 2. Job Order Toggle

Prevailing wage jobs will be activated at the Job Order level.

Example UI element:

Prevailing Wage Job
[ OFF | ON ]

If OFF → Standard Economic Engine

If ON → Prevailing Wage Economic Engine

This keeps the normal labor system untouched.


# 3. Prevailing Wage Data Structure

Prevailing wage data should be stored in a dedicated table.

Example structure:

State | Trade | Base Wage | Fringe
IL    | Millwright | 42.10 | 26.40
IL    | Electrician | 45.80 | 29.10
TX    | Millwright | 34.00 | 18.00

Fields

stateCode
tradeId
baseWage
fringeRate
effectiveDate


# 4. Overtime Rules

Prevailing wage overtime calculation

Regular Pay = Base Wage + Fringe

Overtime Pay =
(Base Wage × 1.5) + Fringe

Example

Base Wage = $40
Fringe = $20

Regular Pay = $60

Overtime Pay = ($40 × 1.5) + $20
Overtime Pay = $80


# 5. Burden Interaction

Prevailing wage does NOT replace the burden system.

The following burdens continue to apply normally

FICA
FUTA
SUTA
Workers Compensation
Admin / PEO
GL / Overhead
Financing / Time Value of Money

Therefore the calculation flow becomes

Prevailing Wage Pay
+ Standard Burdens
= True Labor Cost


# 6. Admin Section

A small admin module may be added

Admin → Prevailing Wage

Structure

State
Trade
Base Wage
Fringe
Effective Date

This screen will behave similarly to the Workers Comp admin screen.


# 7. Economic Engine Routing

Future engine routing logic

if job.prevailing_wage == true:
    use prevailing_wage_engine
else:
    use standard_economic_engine


# 8. Reason for Deferral

Prevailing wage jobs represent a small minority of MW4H work.

Estimated frequency

~3 jobs per year

Because of this, the feature is intentionally deferred to Jarvis 2.0 to avoid slowing the core system build.

END OF DOCUMENT

# 9. Job Order Operational Events System

Purpose

Jarvis Prime 1.0 supports multiple Job Order contacts, including optional trade-specific contacts, but does not yet implement a structured operational events system.

For Jarvis Prime 1.0, the following operational items may temporarily live in dispatch/reporting notes that surface on dispatch packets:

- orientation instructions
- badging instructions
- alternate reporting instructions
- special check-in or safety reporting notes

This notes-based approach is a temporary launch-phase bridge only.

Important rule:

Notes may carry event or instruction details only.

Notes must NOT be used as the source of truth for:

- who the contact is
- which trade the contact belongs to
- whether the contact is primary
- whether a contact replaced a previous contact
- contact role history
- active/inactive contact status

Those responsibilities belong to the Job Order contact system.

Future Jarvis 2.0 architecture should introduce a structured JobOrderEvent system.

Example conceptual model:

JobOrderEvent
- id
- jobOrderId
- tradeId nullable
- type
- title
- startDateTime
- endDateTime nullable
- locationName
- address1
- address2
- city
- state
- zip
- contact linkage or manual contact fields
- notes
- requiredForDispatch

Example event types:

- ORIENTATION
- BADGING
- SAFETY_TRAINING
- REPORT_TO_SITE
- CUSTOMER_CHECK_IN

Architectural intent

This future system will allow Jarvis to model operational events separately from contact records, support alternate locations and alternate reporting contacts, and replace temporary note-based handling after launch.

Reason for deferral

This system is intentionally deferred until after Jarvis Prime 1.0 launch to protect delivery speed and avoid feature creep before April 20.

# 10. Margin Health Threshold Administration

Purpose

Jarvis Prime 1.0 uses centralized shared config constants for margin health thresholds.

This allows Job Orders, invoices, WIP views, and future KPI/reporting surfaces to reuse one consistent health-band interpretation without scattering threshold values across the codebase.

Jarvis Prime 2.0 should introduce admin-configurable global margin health thresholds.

Example threshold structure:

- riskMax
- watchMax

Interpretation:

- Risk = gross margin % below riskMax
- Watch = gross margin % at or above riskMax and below watchMax
- Good = gross margin % at or above watchMax

Architectural intent

The health-band resolver logic should remain centralized and reusable.
Jarvis 2.0 should change the threshold source from shared config constants to admin-managed settings without requiring downstream modules to invent new health logic.

Reason for deferral

This is deferred until after Jarvis Prime 1.0 launch to avoid expanding admin/settings scope before April 20.

---

## 🔒 DEFERRED SYSTEM — CUSTOMER APPROVAL & PERMISSION LAYERING (JOB ORDERS + CHANGE ORDERS)

### Status
Deferred to Jarvis 1.2+ (NOT part of Jarvis 1.0 launch)

---

### Purpose

This section defines the future-state permission and customer approval system for:

- Job Orders
- Change Orders

This system introduces structured, customer-facing approval workflows using magic links.

---

### Current Jarvis 1.0 Behavior

- Job Orders are created and managed internally
- Change Orders are created and managed internally
- No customer-facing approval links are required for core operation
- Staff controls workflow execution

---

### Future Jarvis Behavior (Planned)

Jarvis will support customer-facing approval flows using:

- Email delivery
- SMS delivery
- Action-scoped magic links (no login required)

---

### Approval Scope

#### Job Orders (Future Consideration)

Customer approval may be required for:

- Initial Job Order confirmation (optional / configurable)
- Order activation in certain scenarios

This behavior is not required for Jarvis 1.0 and will be evaluated post-rollout.

---

#### Change Orders (Primary Target for Approval System)

Customer approval will be required for:

- Bill rate increases
- Headcount increases
- Any financial-impacting changes

Customer approval will NOT be required for:

- Start date changes
- Headcount decreases
- No-show adjustments
- Backfill disable decisions

---

### Delivery Method (LOCKED FUTURE BEHAVIOR)

All customer approvals will be sent via:

- Email AND SMS simultaneously

No single-channel fallback logic. Dual delivery is required.

---

### Magic Link Behavior (LOCKED)

- Action-scoped links
- No login required
- Single-purpose approval action
- Fully auditable

---

### Internal Permission Layering (Future)

Jarvis will introduce role-based permissions controlling:

- Who can create Change Orders
- Who can approve internally
- Who can send customer approvals
- Who can override or cancel Change Orders

This will integrate with existing role/permission systems.

---

### Reason for Deferral

This system is intentionally deferred because:

- Staff must first learn Job Orders and Change Orders
- Introducing customer approvals immediately increases complexity
- Phased rollout improves adoption and reduces resistance

---

### Upgrade Path

This system is designed to be:

- Plug-in compatible with existing Change Order architecture
- Added without breaking existing workflows
- Introduced in controlled phases

---

### Architectural Note

This section is a **future-state governance definition only**.

It must NOT be interpreted as active system behavior in Jarvis 1.0.

All implementation must be explicitly pulled from this section into active governance before development.

---

## 🔒 DEFERRED SYSTEM — JARVIS CAREERS: INTERNAL APPLICANT DOCUMENT MANAGEMENT

### Status
Deferred to Jarvis 2 / future-state (NOT part of the current Jarvis Careers build).

Applies exclusively to Jarvis Careers.

---

### Purpose

Allow authorized internal MW4H staff to manage documents associated with an existing Careers applicant **after** the applicant has entered the system.

A common use case: an applicant sends MW4H a resume, certification, license, military document, or other supporting document later by email or another external method, and internal staff need to attach it to the applicant's profile.

---

### What Already Exists (CURRENT — do NOT re-build or describe as future work)

The following Careers document capabilities are already implemented and are NOT part of this deferred feature:

- Public Careers applicants may OPTIONALLY upload a resume.
- Public resume upload uses the existing Careers document architecture.
- Resume files are stored in the private AWS S3 Careers bucket (S3 remains private).
- The presigned S3 upload/download architecture is implemented.
- An application can associate an uploaded resume Document.
- Authorized internal MW4H staff can securely view/download resumes associated with applications (presigned download).
- The internal Applicant Detail page includes a Documents section that displays application-associated resumes.
- The `ApplicantDocument` backend foundation and upload-lifecycle architecture have been started (see the Careers V2.1.8 architecture governance).
- `CareersDocumentsService` remains the single Careers S3 abstraction.

This deferred feature builds ON TOP of that existing foundation; it does not replace it, and none of the items above are considered future work.

---

### Future / Deferred Scope (NOT yet built)

- Full internal applicant document listing and management on the Applicant Profile.
- Internal upload UI for documents received OUTSIDE the public application process.
- Cert / License management.
- Military / DD-214 document management.
- Broader internal document lifecycle actions (replace / archive / delete with audit).

---

### Internal Document Categories

The future internal document management system should support at minimum the following primary categories, using the user-facing terminology shown:

1. Resume
2. Cover Letter
3. Cert / License
4. Military / DD-214
5. Portfolio
6. Other

Certifications and licenses are intentionally grouped into one primary category, shown to users as **"Cert / License."**

The system MAY later support optional subtype / description metadata, for example:

- OSHA 10
- OSHA 30
- Driver's License
- Professional License
- CPR / First Aid
- Trade Certification
- Other Certification / License

These subtypes are ILLUSTRATIVE only. Do not over-design them or lock them as mandatory database enums unless active governance explicitly requires it at implementation time.

---

### Functional Future State

Authorized internal staff should eventually be able to:

- Open an Applicant Profile.
- View a Documents section.
- See all authorized documents associated with that applicant.
- Upload a new document.
- Select the appropriate document category.
- Add optional identifying metadata or description where appropriate.
- Securely view / download documents.
- Potentially replace, archive, or delete documents, subject to future governance and audit requirements.

---

### Security

All applicant documents must remain private. The future implementation must:

- Reuse the existing `CareersDocumentsService` / Careers S3 architecture (no second S3 abstraction).
- Use private AWS S3 storage.
- Use presigned upload / download URLs as appropriate.
- Never expose AWS credentials.
- Never make applicant documents publicly accessible.
- Enforce existing or future Careers RBAC authorization.

Military records, including DD-214 documents, may contain sensitive personal information and require appropriately restricted internal access. The exact RBAC model for sensitive document categories must be finalized before implementation.

---

### Public Applicant Boundary (LOCKED — unchanged by this deferral)

The public Careers application workflow remains intentionally restricted. Public applicants may upload:

- Resume ONLY.

This deferred internal document management feature MUST NOT be interpreted as authorization to expose general document upload functionality to public applicants.

Public applicants must NOT automatically receive upload capabilities for:

- Driver's licenses
- IDs
- OSHA cards
- Certifications
- Professional licenses
- DD-214 documents
- Other sensitive documents

Any future expansion of public document uploads requires SEPARATE governance approval.

---

### Architectural Boundary

This deferred feature applies EXCLUSIVELY to Jarvis Careers.

It establishes no architectural precedent for Jarvis Workforce, Friday, Customers, Sales, Orders, Commercial, or any other Jarvis application/module. Any adoption of a shared / enterprise document ownership model by another application would be a separate, independently governed initiative.

---

### Reason for Deferral

- This feature is intentionally deferred.
- The current Careers document/resume functionality is sufficient for the present operational phase.
- Internal Applicant Document Management is NOT required to complete the current Careers implementation.
- Higher-priority Jarvis operational development takes precedence.
- The feature should be revisited as part of Jarvis 2 / future-state development.

---

### Architectural Note

This section is a **future-state governance definition only**.

It must NOT be interpreted as active system behavior in the current build.

The existing Careers V2.1.8 architecture governance (`02_backend/governance/CAREERS_V2_1_8_APPLICANT_DOCUMENT_ARCHITECTURE.md`, including its V2.1.8D applicant-document CRUD phase) remains the authoritative Careers-application governance for the underlying foundation. All implementation of this deferred feature must be explicitly pulled from this section into active governance before development.

---

## 🔒 DEFERRED SYSTEM — JARVIS CAREERS: DIGITAL OFFER LETTER & ACCEPTANCE WORKFLOW

### Status
Deferred to Jarvis 2 / future-state (NOT part of the current Jarvis Careers build).

Applies specifically to Jarvis Careers and the internal hiring process.

---

### Purpose

Jarvis Careers should eventually support a complete digital employment-offer workflow for applicants MW4H decides to hire.

The future workflow should allow authorized MW4H staff to create a formal employment offer from the applicant/application hiring process, send the applicant a secure link to review the offer, and allow the applicant to accept or decline the offer digitally.

This feature is intentionally deferred to Jarvis 2 because the current Careers system is sufficient for the present operational phase and higher-priority Jarvis operational development takes precedence.

---

### Future Workflow

The future-state workflow should conceptually support:

Applicant / Application
→ Hiring Decision
→ Create Offer
→ Review / Approve Offer
→ Send Offer
→ Applicant Opens Secure Link
→ Applicant Reviews Offer
→ Applicant Accepts or Declines
→ Jarvis Records Final Outcome

The exact implementation may evolve during future design.

---

### Offer Letter Content

The future offer letter should support appropriate employment-offer information including, at minimum:

- Applicant name
- Position / Job Title
- Job Description
- Employment Type
- Compensation Type
- Offered Compensation
- FLSA Classification
- Work Location
- Expected Schedule / Standard Work Hours
- Proposed Start Date
- Reporting Structure
- Benefits included in the offer
- Additional employment terms or conditions, where applicable

---

### Compensation

The offer must support compensation structures appropriate to the Position and offer, including:

- Hourly
- Salary
- Commission
- Salary + Commission

Where applicable, the offer should clearly capture the actual compensation being offered, such as:

- Hourly rate
- Annual salary
- Commission structure or reference to applicable commission terms

Do not over-design detailed commission architecture in this deferred governance unless existing governance already defines it.

---

### FLSA

The offer should clearly capture the applicable FLSA classification:

- Exempt
- Non-Exempt

The system should use existing Careers Position / Job Posting information where appropriate but allow the final offer terms to be explicitly confirmed before the offer is sent.

---

### Benefits

The offer letter should support communicating the benefits included with the employment offer.

Future governance may determine whether benefits are:

- Entered manually
- Selected from standardized benefit templates
- Inherited from Position/company defaults
- Or generated through another future benefits architecture

Do not lock a specific benefits architecture at this stage unless one already exists in governance.

---

### Offer Snapshot Principle

The final offer must preserve a historical snapshot of the actual terms offered to the applicant.

Once an offer is sent, subsequent changes to:

- Position
- Job Posting
- Position Defaults
- Compensation defaults
- Benefits defaults
- Job Description
- Schedule

must NOT silently alter the historical offer that was sent.

The offer record should preserve the terms that existed at the time the offer was issued.

If an offer needs to change after it has been sent, future governance should define an appropriate amendment, withdrawal, replacement, or reissue workflow rather than mutating historical terms without an audit trail.

---

### Offer Status / Lifecycle

The future architecture should support an auditable offer lifecycle.

Potential statuses should include, at minimum:

- Draft
- Sent
- Viewed
- Accepted
- Declined
- Withdrawn
- Expired

These status names may be refined during future implementation governance.

The system should record meaningful lifecycle timestamps where appropriate, including concepts such as:

- Created At
- Sent At
- First Viewed At
- Accepted At
- Declined At
- Withdrawn At
- Expired At

Do not over-design the database schema in this governance task.

---

### Applicant Experience

The applicant should eventually receive a secure, unique offer link.

Through that link, the applicant should be able to:

- Review the offer letter
- Review the employment terms
- Review offered compensation
- Review benefits information
- Review the proposed start date
- Accept the offer
- Decline the offer

The workflow should be usable without requiring the applicant to have an internal Jarvis employee account.

The secure public offer route must be appropriately protected using a future tokenized or equivalent secure-access architecture. Do not expose internal Jarvis Careers data beyond what is required for the applicant to review their specific offer.

---

### Acceptance / Decline

When an applicant accepts or declines:

- Jarvis should record the decision.
- Jarvis should record the timestamp.
- The decision should be associated with the correct applicant, application, and offer.
- The historical offer terms should remain preserved.
- Internal Careers users should be able to see the current offer status.

Future governance should determine whether additional actions are required upon acceptance, such as:

- Electronic acknowledgment
- Electronic signature
- Typed legal name
- IP/device audit metadata
- Conversion to employee onboarding
- Notifications to hiring managers or administrators

Electronic signature / formal acknowledgment requirements are intentionally NOT designed here. They must be finalized before implementation based on business and legal requirements. Do NOT lock an electronic-signature architecture during this deferral.

---

### RBAC / Internal Authorization

The future implementation must define who may:

- Create an offer
- Edit a Draft offer
- Approve an offer
- Send an offer
- Withdraw an offer
- Reissue or replace an offer
- View compensation details
- View offer history

The exact Careers RBAC permissions should be finalized before implementation. Do not invent or implement new permissions during this governance-only phase.

---

### Security

The future implementation must:

- Protect compensation and employment-offer information.
- Use secure authenticated internal access for MW4H staff.
- Use a secure unique/tokenized applicant-facing link.
- Prevent applicants from accessing another applicant's offer.
- Preserve an audit trail of offer lifecycle actions.
- Avoid exposing internal-only Careers information through the public offer route.

If offer letters are rendered or stored as documents/PDFs in the future, they should use the appropriate private Jarvis Careers document-storage architecture (e.g., `CareersDocumentsService` / private S3) rather than public file storage. Do not mandate PDF generation; future design may choose another canonical representation.

---

### Relationship to Existing Careers Architecture

Preserve the existing Careers principles:

- **Position** = permanent organizational role.
- **Job Posting** = hiring event.
- **Applicant** = individual candidate.
- **Application** = applicant's candidacy for a specific Job Posting.

The future **Offer** should represent the specific employment terms being offered to an applicant as part of a hiring decision. The Offer should NOT redefine the Position or Job Posting.

Where appropriate, an offer may initialize its fields from existing Position / Job Posting / Application information, but the final sent offer must become an immutable or historically preserved snapshot of the terms actually offered (see Offer Snapshot Principle).

---

### Future Hiring Transition

An Accepted offer may eventually become a trigger or prerequisite for future employee onboarding/hiring conversion.

However:

- Do NOT design the employee onboarding system in this task.
- Do NOT assume automatic employee creation unless future governance explicitly approves it.

The boundary between Accepted Offer → Hired Applicant → Employee Record → Onboarding should be governed separately before implementation.

---

### Architectural Boundary

This deferred feature applies specifically to Jarvis Careers and the internal hiring process.

It establishes no architectural precedent for Jarvis Workforce, Friday, Customers, Sales, Orders, Commercial, or any other Jarvis application/module.

---

### Reason for Deferral

- This feature is intentionally deferred to Jarvis 2 / future-state development.
- It is not required to complete the current Careers operational implementation.
- Current Careers functionality remains sufficient for the present operational phase.
- Higher-priority Jarvis operational work takes precedence.
- The feature is being documented now so the business requirement is preserved and not forgotten.

---

### Architectural Note

This section is a **future-state governance definition only**.

It must NOT be interpreted as active system behavior in the current build.

This task documents the future feature ONLY. It authorizes no offer APIs, database/Prisma models, UI, public routes, email delivery, electronic signatures, PDF generation, or onboarding. All implementation must be explicitly pulled from this section into active governance before development.

---

