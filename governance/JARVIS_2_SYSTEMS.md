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
