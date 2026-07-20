# FRIDAY EXECUTION PANEL
**Status:** LOCKED GOVERNANCE  
**System:** Friday  
**Canonical Name:** Friday Execution Panel  
**Purpose:** Define the real-time call execution layer inside Friday so future build work remains deterministic, non-drifting, and clearly separated from other Jarvis Prime systems.

---

## 1. Purpose

The **Friday Execution Panel** is the real-time sales execution layer used **during live calls placed inside Jarvis/Friday**.

It is **not** a general CRM, **not** a passive note-taking widget, and **not** a replacement for the Jarvis Quote system, customer core, or contract core.

Its purpose is to let a salesperson:

- talk to a lead, prospect, current customer, or contact **inside Jarvis**
- view the most relevant company/contact context during the call
- generate live pricing guidance using the existing burden logic
- create soft recap emails that feel human and are delayed before sending
- create formal quotes when the conversation justifies it
- send company/contact-targeted MSA flows with signature tracking
- capture and persist call intelligence directly into Jarvis without losing momentum after the call

This system exists to convert a live sales conversation into an **executable sales event** while the rep is still on the phone.

---

## 2. Canonical Naming

### 2.1 Locked feature name
- **Friday Execution Panel**

### 2.2 Allowed shorthand
- **Execution Panel** (only when the surrounding context is clearly Friday)

### 2.3 Prohibited alternate names
Do **not** rename or blend this feature into other names such as:
- Deal Builder
- Quick Actions
- Sales Assistant
- Call Tools
- CRM Panel
- Quote Panel
- Prospect Panel

Reason: this feature must remain semantically distinct from Quotes, CRM, Contacts, and other Jarvis Prime modules.

---

## 3. Core Operating Principle

The Friday Execution Panel is a **live-call action layer**.

The system must be designed around this rule:

> Work that normally happens after a sales call should be executable during the call, without losing control, data integrity, or brand consistency.

This system is specifically intended to reduce or eliminate the lag between:
1. conversation
2. pricing discussion
3. recap
4. quote
5. MSA delivery
6. lead/contact creation
7. next-step scheduling

---

## 4. System Boundary

### 4.1 What the Friday Execution Panel IS
It is:
- a live-call execution workspace inside Friday
- a structured action layer for pricing, recap, quote, and MSA actions
- a bridge between Friday and existing Jarvis Prime systems
- a standardized MW4H-tone communications launcher
- a capture point for real-time sales intelligence

### 4.2 What the Friday Execution Panel is NOT
It is not:
- the master CRM record itself
- the formal Quote system itself
- the formal contract repository itself
- a generic notes app
- a freeform AI chat toy
- a separate customer database outside Jarvis
- a replacement for governance-backed financial logic

### 4.3 Boundary rule
The Friday Execution Panel may **initiate** actions in other systems, but it may not create parallel, conflicting logic stores for:
- burden math
- formal quote system-of-record behavior
- customer/company core records
- contact core records
- contract signature state

---

## 5. Live Call Requirement

### 5.1 Locked call method
Calls are placed **inside Jarvis/Friday**.

This is required so the system can support:
- call recording
- transcript generation
- event linking
- rep activity tracking
- action execution during the call
- structured post-call automation

### 5.2 Implication
The Friday Execution Panel must be designed with the assumption that the call session itself is a first-class object/event in the system.

---

## 6. Primary UI Context During Call

During a live call, the rep should be able to view the current context in one workspace, including at minimum:

- company name
- contact name
- contact phone
- contact email
- company status (lead / prospect / current customer / etc.)
- chronological notes/timeline for that company/contact
- prior interactions relevant to the call
- obvious actions available through the Friday Execution Panel

This screen should be designed for clarity and speed, not for general admin clutter.

---

## 7. Core Execution Actions

The Friday Execution Panel is centered around four primary live-call action families:

1. **Quick Price / Verbal Quote**
2. **Send Recap Email**
3. **Send Formal Quote**
4. **Send MSA**

These must remain distinct actions with distinct data/record consequences.

---

## 8. Quick Price / Verbal Quote Action

### 8.1 Purpose
This action allows the rep to produce live pricing guidance during a conversation using existing burden logic.

### 8.2 Required logic source
This action must use the **existing burden logic / burden engine already established in Jarvis Prime**.

The Friday Execution Panel must **not** create its own separate burden math implementation if a canonical burden path already exists.

### 8.3 Minimum user inputs
At minimum, the pricing action must support:
- state
- trade
- pay rate

Example:
- State: Kentucky
- Trade: Millwright
- Pay Rate: $31/hour

### 8.4 Required outputs
At minimum, the pricing result must show:
- standard-time burden/cost result
- overtime burden/cost result
- double-time burden/cost result

### 8.5 Required pricing display modes
The pricing action must support **three distinct layers/modes**.

#### Mode A — Preset Margin Suggestions
This mode behaves conceptually like modern restaurant receipt tip suggestions.

The system pre-calculates multiple margin-based billing outcomes so the rep can speak quickly without doing math.

Examples may include:
- 15% margin
- 20% margin
- 25% margin

For each suggestion, the system should show the resulting:
- standard bill rate
- overtime bill rate
- double-time bill rate

Purpose:
- help the rep give a quick, conversational range
- remove mental math during the call

#### Mode B — Manual Margin Input
The rep manually enters a target margin percentage, such as:
- 20%

The system then calculates the resulting:
- standard bill rate
- overtime bill rate
- double-time bill rate

Purpose:
- allow the rep to shape the pricing discussion around a targeted margin outcome

#### Mode C — Dollar Gross Profit Input
The rep manually enters a target dollar gross profit amount per standard hour, such as:
- $7.50/hour

The system then calculates the resulting:
- standard bill rate
- overtime bill rate
- double-time bill rate

Purpose:
- allow the rep to price from a line-item gross-profit perspective rather than a margin-percent perspective

### 8.6 Output labeling requirement
The system must clearly distinguish:
- pay rate
- burdened cost
- suggested bill rate
- soft pricing guidance vs formal quote values

No ambiguous labels.

### 8.7 Governance requirement
Quick Price results may be used conversationally and inside recap summaries, but they do **not** become a formal quote unless the formal quote action is explicitly invoked.

---

## 9. Soft Quote vs Formal Quote Split

This distinction is locked.

### 9.1 Soft Quote
A **Soft Quote** is:
- non-binding
- conversational
- based on burden-backed pricing logic
- appropriate for recaps or early-stage pricing discussions
- not the formal system-of-record quote artifact

A recap email may contain soft pricing language, provided it is framed as general, non-binding guidance.

### 9.2 Formal Quote
A **Formal Quote** is:
- explicitly generated through the formal quote action
- tied to the Jarvis Quote system
- treated as the formal quote system-of-record output
- subject to quote-level controls, templates, and governance

### 9.3 Prohibition
Do not allow Quick Price or recap-email logic to silently or automatically create a formal quote without an explicit formal quote action.

---

## 10. Send Recap Email Action

### 10.1 Purpose
This action creates and sends a human-sounding summary email after a live call.

### 10.2 Tone requirement
The recap email must use a **standardized MW4H tone**.

It must not vary heavily by rep personality.  
It may still be personalized with contextual details from the call.

### 10.3 Content rule
The recap email must **not** be a raw transcript dump.

It must instead produce a clean, logically ordered human recap, including as appropriate:
- appreciation for the contact’s time
- a short recap of the discussion
- relevant location/trade/project timing details discussed
- soft pricing recap if discussed
- reasonable next steps
- natural professional wording that sounds like a human rep wrote it

### 10.4 AI invisibility requirement
The generated recap should not read like obvious AI output.

This means:
- no robotic repetition
- no transcript-style phrasing
- no “as discussed” overuse
- no generic filler that sounds mass-generated
- no immediate-send behavior that signals automation

### 10.5 Delay-send rule
Recap emails must **not** send immediately by default.

A delayed send behavior is required so it appears the rep took time to write the email.

### 10.6 Locked delay target
Default behavior target:
- **approximately 20 minutes after the call/action**

Exact implementation can be configurable later, but the governance intent is that recap emails should not appear to send instantly.

### 10.7 Sender rule
The email should appear to come from the rep in normal business context, not from an obvious AI/system persona.

### 10.8 Safety/approval principle
The system may support rep review/edit before send, but the governance intent is that the panel can generate a near-ready recap very quickly.

---

## 11. Send Formal Quote Action

### 11.1 Purpose
This action converts the call momentum into a formal quote process when appropriate.

### 11.2 System-of-record rule
A formal quote generated from the Friday Execution Panel must be tied into the **Jarvis Quote system**.

The Friday Execution Panel may launch or prefill the quote flow, but it is not the quote system-of-record.

### 11.3 Prefill expectation
The quote action should be able to prefill from the call context where available, including examples such as:
- company
- contact
- state
- trade
- discussion details
- preliminary rate assumptions

### 11.4 Boundary rule
Formal quote lifecycle, quote record integrity, and quote persistence belong to the formal Quote system, not to an ad hoc data store inside the panel.

---

## 12. Send MSA Action

### 12.1 Purpose
This action sends a Master Service Agreement during or immediately following the call when the conversation reaches that point.

### 12.2 Required behavior
This is **not** just a “send generic PDF” action.

The MSA flow should be logic-driven and targeted using known context such as:
- company name
- company information
- contact name
- contact email
- other captured details relevant to the agreement package

### 12.3 Signature tracking requirement
The MSA flow must be designed as a **signature-tracking flow**, not a blind document send.

Target capabilities include:
- sent status
- viewed status
- signed status
- pending status
- history/auditability

### 12.4 Contact-targeting rule
The MSA should be directed to a real contact, such as John Smith, at a real company, such as ABC Millwright Company, rather than being treated as a contextless attachment.

### 12.5 Future-friendly rule
Implementation may later expand into deeper agreement management, but this governance file locks the requirement that MSA delivery must be contextual and trackable.

---

## 13. Automatic Lead / Company / Contact Capture

### 13.1 Purpose
The Friday Execution Panel must not let valuable call intelligence disappear after a productive conversation.

### 13.2 Required capture behavior
When the rep captures or confirms information during the call, the system should be able to persist that information into Jarvis structures such as:
- company/lead record
- contact record
- call record
- notes/timeline
- action history

### 13.3 Example captured data
Examples include:
- contact name
- email
- phone
- direct line
- company name
- company status
- project timing
- state/location
- trade interest
- pricing discussed
- follow-up intent

### 13.4 Lead creation rule
If the company is not yet an active customer, the system may create or update a lead/prospect-style company record rather than forcing it into “active customer” status.

### 13.5 Contact rule
Captured contacts should attach under the appropriate company record rather than living only inside the transcript or email body.

### 13.6 Data integrity rule
The panel should create/update canonical records rather than creating isolated, panel-only copies of important business entities.

---

## 14. Call Recording, Transcript, and Conversation Intelligence

### 14.1 Recording/transcript expectation
Calls inside Friday should support:
- recording
- transcript generation
- event-linked conversation history

### 14.2 Usage of transcript
The transcript is an internal intelligence source. It may be used to help generate:
- summaries
- follow-up actions
- extracted structured fields
- activity timeline entries

### 14.3 Prohibition
Do not send the raw transcript to the external contact as the recap email.

### 14.4 Extraction principle
The transcript may help identify structured data points such as:
- names
- dates
- states
- trades
- project timing
- intent signals
- follow-up commitments

### 14.5 Audit principle
Call-derived actions should remain traceable back to the call event.

---

## 15. Standardized MW4H Tone

### 15.1 Tone lock
Friday Execution Panel outbound written communication must use a **standardized MW4H tone**.

### 15.2 Tone goals
The tone should be:
- professional
- direct
- human
- respectful of the recipient’s time
- confident without sounding canned
- operationally clear
- not flashy or gimmicky

### 15.3 Tone anti-patterns
Avoid:
- obvious AI phrasing
- robotic formatting
- excessive warmth that feels fake
- overlong emails
- jargon for its own sake

---

## 16. Required Integration Points

The Friday Execution Panel must be designed to integrate with existing/future Jarvis Prime systems without duplicating their core ownership.

### 16.1 Burden / pricing logic
- existing burden engine / burden logic path

### 16.2 Quote system
- formal quote generation and persistence

### 16.3 Company/contact system
- lead/company/contact records and linkage

### 16.4 Communication layer
- delayed send recap email behavior
- outbound quote and MSA communications

### 16.5 Agreement / signature layer
- MSA send/view/sign tracking

### 16.6 Activity/timeline layer
- call event
- notes
- transcript-derived summaries
- actions taken during/after call

---

## 17. Non-Goals / Prohibitions

The following are explicitly prohibited unless governance is later amended.

### 17.1 No duplicate financial engine
Do not create a separate pricing or burden engine just for Friday if a canonical burden path already exists.

### 17.2 No automatic formal quote creation
Do not silently convert pricing guidance into a formal quote.

### 17.3 No raw transcript emailing
Do not dump transcript text into customer-facing recap emails.

### 17.4 No instant-send recap default
Do not default recap emails to immediate send.

### 17.5 No brand-tone drift
Do not allow this panel to produce wildly different rep-by-rep AI writing styles.

### 17.6 No parallel customer/contact database
Do not let the Friday Execution Panel become a shadow CRM with separate truth for company/contact data.

### 17.7 No semantic mingling
Do not merge the Friday Execution Panel concept into:
- Quotes
- CRM
- Contracts
- Customer Profile
- generic AI tools

It is a bridge/action layer, not a replacement for those systems.

---

## 18. Build Philosophy

The Friday Execution Panel should be built as a governance-backed execution layer that:
- increases rep speed
- preserves data integrity
- keeps financial logic centralized
- produces human-feeling communication
- compresses the sales cycle into the live call window

This feature is strategically important because it turns a standard sales call into a structured, traceable, executable revenue event.

---

## 19. Future Expansion Notes

The following are natural future expansions but are not required to change the locked principles above:
- configurable recap delay timing
- approval/review modes before send
- richer quote prefill logic
- smarter field extraction from transcript
- deal-stage scoring
- rep coaching signals
- MSA clause/variation workflows
- follow-up task automation
- pipeline probability signals

These may be added later without violating this governance file so long as the core boundaries remain intact.

---

## 20. Final Lock Summary

The following decisions are locked by this governance file:

- The canonical feature name is **Friday Execution Panel**
- It operates during calls placed **inside Jarvis**
- It uses a **standardized MW4H tone**
- Quick Price uses existing burden logic
- Quick Price supports:
  - preset margin suggestions
  - manual margin input
  - dollar gross-profit input
- Soft Quote and Formal Quote are distinct and must remain distinct
- Formal Quote is tied to the **Jarvis Quote system**
- MSA delivery is contextual and includes **signature tracking**
- Recap emails are humanized summaries, **not transcripts**
- Recap emails are delayed before sending so they do not appear instantly AI-generated
- Company/contact/call intelligence should persist into canonical Jarvis records
- The panel is an execution/action layer, not a replacement for CRM, Quotes, or Contracts

---

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
   - Imported / unowned leads do NOT start with ownership.
   - For imported / unowned leads, ownership is created only after a qualifying meaningful/progressing engagement through existing control logic.
   - Only then does the imported / unowned record transition into Friday prospect/control enforcement (11-day / 55-day clocks, etc.).
   - EXCEPTION (see 2026-07-17 addendum): a Prospect intentionally created by a Salesperson inside Friday starts with temporary control immediately at creation. This is the only path where temporary control begins before a meaningful engagement event.

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

---

## 2026-07-17 ADDENDUM — SALESPERSON-CREATED PROSPECT IMMEDIATE CONTROL (LOCKED)

Leadership has approved a revised Prospect ownership philosophy. This addendum
EXPANDS the prior governance; it does NOT replace it. The meaningful-engagement rule
continues to apply to imported / unowned leads. This addendum adds a second, equally
legitimate entry point: immediate temporary control for intentionally created
Salesperson Prospects (see the OWNED-FIRST / UNOWNED-LEAD FALLBACK addendum,
section 4 — OWNERSHIP CREATION POINT, and the TEMPORARY CONTROL ENTRY POINTS section below).

1. NEW BUSINESS RULE
   - When a Salesperson intentionally creates a new Prospect inside Friday, the
     system SHALL immediately grant that Salesperson temporary control of the Prospect.
   - The act of intentionally creating the Prospect represents a business investment
     and establishes accountability.
   - Temporary control begins immediately upon Prospect creation. No meaningful
     interaction is required to start the clock.

2. TEMPORARY CONTROL START (SALESPERSON-CREATED PROSPECTS)
   Upon creation, the following begin immediately:
   - Temporary control
   - Ownership timer
   - 11-working-day touch timer
   - 55-working-day control window
   The Salesperson is now responsible for progressing the opportunity.

3. SCOPE — APPLIES ONLY TO SALESPERSON-CREATED PROSPECTS
   - This change applies ONLY to Prospects intentionally created by a Salesperson.
   - Imported Leads remain UNCHANGED (ZoomInfo, spreadsheet imports, resume imports,
     marketing imports, and other unowned lead sources).
   - Imported / unowned records remain unowned until a qualifying control event occurs
     under existing governance.

4. ENFORCEMENT UNCHANGED
   All existing enforcement rules remain in force. Only the STARTING POINT changes for
   salesperson-created Prospects. The following continue to apply unchanged:
   - 11-working-day touch rule
   - 4-day grace period
   - 55-working-day control window
   - Automatic release
   - Override rules
   - Anti-hoarding enforcement
   - Admin override

5. OWNERSHIP PHILOSOPHY (CLARIFIED)
   - Salesperson-created Prospect: rep intentionally identifies and creates the
     opportunity → temporary control begins immediately.
   - Imported Lead: lead enters the system without ownership → temporary control begins
     only after a qualifying governance-approved control event.

6. INTENT
   "We reward initiative while still enforcing accountability."
   - Salespeople are trusted with temporary control immediately after creating a Prospect.
   - If they fail to develop the opportunity within the governed timeframes, the system
     automatically releases the Prospect back to the pool under the existing enforcement rules.
   - As stated during architecture review: "The system gives the Salesperson enough rope
     to hang themselves." The Salesperson immediately gains responsibility; failure to
     actively manage the Prospect results in automatic release under the existing rules.

---

## 2026-07-17 ADDENDUM — TEMPORARY CONTROL ENTRY POINTS (LOCKED)

Governance clarification. This section documents that temporary control now has
exactly TWO governance-approved entry points. The governance has been EXPANDED,
not replaced: both paths are legitimate, and both converge into the same temporary-
control enforcement model.

### METHOD 1 — Salesperson-Created Prospect
   - A Salesperson intentionally creates a new Prospect inside Friday.
   - Immediate temporary control begins upon Prospect creation.
   - Immediately begin:
     - Temporary control
     - Ownership timer
     - 11-working-day touch timer
     - 55-working-day control window
   - Rationale: intentional creation is a business investment and establishes accountability.

### METHOD 2 — Imported / Unowned Lead
   - An imported or otherwise unowned Lead enters Friday.
   - Examples include:
     - ZoomInfo
     - Spreadsheet imports
     - Resume imports
     - Marketing imports
     - Other imported lead sources
   - These Leads remain unowned until a qualifying governance-approved control event occurs.
   - Only then does temporary control begin.

### OWNERSHIP PHILOSOPHY (EXPANDED)
   "We reward initiative while still enforcing accountability."
   - Salesperson-created Prospects reward initiative.
   - Imported Leads reward earned engagement.
   - Both paths ultimately enter the same temporary-control enforcement system.
   - After temporary control begins, ALL existing enforcement remains identical regardless
     of how temporary control was obtained.

### ENFORCEMENT (BOTH METHODS)
   Both entry methods immediately enter the same enforcement model. The following continue
   to apply, unchanged, regardless of entry path:
   - 11-working-day touch rule
   - 4-day grace period
   - 55-working-day control window
   - Automatic release
   - Override rules
   - Anti-hoarding enforcement
   - Admin override

   The ONLY difference between the two paths is the event that begins temporary control.

---
**End of governance file**
