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
