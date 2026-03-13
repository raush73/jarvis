# COMMISSIONS ENGINE ARCHITECTURE

## Status
LOCKED

## Purpose
This file locks the core architecture for the Jarvis Prime commissions system so future build sessions do not scatter commission logic across controllers, services, reports, invoice flows, or UI pages.

## Phase 1 Status
Phase 1 is complete and remains locked.

Phase 1 includes:
- one global active `CommissionPlan`
- editable `defaultRate`
- editable `CommissionPayoutTier` rows
- backend endpoints to read and update the active plan
- frontend Admin Commissions page wired to real backend data
- percent/decimal conversion between UI and backend

Phase 1 explicitly deferred:
- salesperson overrides
- non-default plans
- split commissions
- customer overrides
- job-order overrides
- accounting commission pages
- resolver/math expansion

Phase 1 deferred implementation of split commissions and job-order override behavior, but the architectural source of truth for future split allocation is locked to the Job Order as defined later in this file.

## Core Rule
All commission calculation behavior in Jarvis Prime must flow through a centralized commission engine.

No module may implement independent commission math or commission plan resolution outside the centralized commission engine.

## Required Central Services
The commissions engine must be centered on these services:

- `CommissionResolverService`
- `CommissionMathService`

Optional orchestration/service layers may exist around them, but resolution and math must remain centralized in these core services.

## CommissionResolverService Responsibility
`CommissionResolverService` is responsible for determining the effective commission context for a given business event.

It must resolve:

- which commission plan applies
- which participant or participants are commissionable
- whether default or override behavior applies
- whether a split applies
- the effective split percentages
- the effective payout tier context
- the source of the final resolved decision
- the effective date window for the resolved rule set

The resolver decides **what applies**.
It does **not** perform raw commission arithmetic beyond selecting the correct resolved inputs.

## CommissionMathService Responsibility
`CommissionMathService` is responsible for numeric commission calculation only.

It must calculate:

- raw commission amount
- multiplier-adjusted commission amount
- split allocation amounts
- rounding behavior
- final payable amount

The math service performs **the arithmetic**.
It does **not** decide plan precedence, override precedence, assignment ownership, or participant selection.

## Separation of Concerns
The following separation is mandatory:

- resolver = determines applicability and resolved commission inputs
- math service = calculates monetary outputs from resolved inputs
- orchestration service = persists events / exposes APIs / coordinates flow

Controllers, report builders, invoice posting flows, and UI pages must not contain independent commission resolution or commission math logic.

## Centralized Financial Math Rule
Commissions must not recreate burden or margin calculations independently.

When commissionable economics depend on trade margin, payroll burden, or related financial calculations, the commission engine must use the canonical existing financial math path already established in Jarvis Prime.

No duplicate burden math.
No duplicate margin math.
No alternate local commissionable-base formulas outside the approved financial engine path.

## Resolution Precedence Rule
When later phases introduce overrides, the precedence model must remain explicit and centralized.

The intended precedence order is:

1. Job Order override
2. Customer-level override
3. Salesperson default plan
4. Global fallback/default plan

If future design changes this order, the change must be made in governance first before implementation.

## Split Commission Rule
Split commission behavior must be resolved centrally by the resolver layer.

Split logic must not be implemented independently in:
- invoice payment services
- report generators
- UI pages
- export scripts
- controller methods

All split attribution must come from a centralized resolved commission context.

## Commission Event Rule
Commission event creation must eventually consume the centralized commission engine.

As the commissions system evolves, commission event creation must call the resolver and math services rather than embedding business logic directly in event-creation flows.

## Reporting Rule
Accounting/reporting pages must read persisted or centrally derived commission outputs.
They must not implement their own hidden commission formulas.

## Phase 2 Scope Lock
Phase 2 is authorized to begin after this file is created.

Phase 2 may include:
- `CommissionResolverService`
- `CommissionMathService`
- migration of commission event creation to centralized resolution/math flow
- support for non-default plan resolution
- support for split commissions
- support for future override precedence

Phase 2 must still respect:
- centralized financial math
- no duplicated commission logic
- no controller-level commission math
- no UI-level commission math

## Prohibited Patterns
The following are prohibited unless Michael explicitly unlocks them:

- commission math inside controllers
- commission math duplicated in multiple services
- separate payout formulas in reports vs event creation
- UI pages inventing commission formulas
- invoice services bypassing the centralized commission engine
- name-based override keys instead of stable entity IDs
- silent precedence rules that are not documented in governance

## Architectural Intent
Jarvis Prime commissions must scale from the current active-plan model to a future system that supports:
- non-default plan resolution
- split commissions
- order/customer overrides
- consistent event creation
- auditable reporting

This scalability must be achieved by centralizing logic, not by scattering special-case formulas throughout the codebase.

## Authority
This file is a governance lock for Jarvis Prime.
All future commission capsules, agent runs, and implementation sessions must comply with it unless Michael explicitly supersedes or unlocks it.

## Commissionable Base Rule
Commission calculations in Jarvis Prime are based on paid-invoice trade-line gross margin only.

The commissionable base includes:
- trade labor lines on the invoice
- gross margin derived from those trade lines through the canonical burden/margin path

The commissionable base explicitly excludes:
- per diem
- bonuses
- travel pay
- employee reimbursements
- non-trade compensation lines
- any non-trade invoice amounts unless explicitly added by future governance

If an invoice contains multiple trade lines, the commissionable base is the combined commissionable gross margin of the eligible trade lines only.

Invoice-level totals must not be used as a shortcut if they include excluded non-commissionable amounts.

## Split Source of Truth Rule
Commission split percentages are sourced from the Job Order.

Job Order commission split configuration is the source of truth for split allocation when split commissions apply.

The CommissionResolverService must read split allocation from the Job Order commission split structure rather than inventing or inferring split percentages elsewhere.

Split logic must allocate an already-determined commission pool.
Split logic must not create additional commission value.

## Commission Economic Flow Rule
The required commission economic flow in Jarvis Prime is:

1. invoice payment is posted
2. paid invoice trade-line economics are identified
3. commissionable gross margin is taken from the canonical burden/margin-backed financial path
4. CommissionResolverService resolves plan, participants, split, and payout-tier context
5. CommissionMathService calculates commission amounts from the resolved context
6. commission events and related persisted outputs are created from those results

The CommissionMathService must consume canonical commissionable gross margin inputs.
It must not independently recreate burden math, trade margin math, or invoice economic snapshots.

## Trade-Line Only Rule
Commissions are trade-line only.

Even when an invoice contains many line types, only eligible trade lines participate in commission calculations.

Non-trade amounts are non-commissionable by default unless future governance explicitly unlocks them.

## Phase 3 — Reusable Commission Plans and Job Order Plan Selection

Phase 3 expands the commissions system to support multiple reusable CommissionPlan structures managed from the Admin Commissions interface.

### Commission Plan Templates

Admin users may create and manage reusable CommissionPlan templates.

Each CommissionPlan represents a complete commission payout structure consisting of:

- a base commission rate
- a set of payout tiers defined by day ranges
- tier multipliers that adjust the payable commission amount

Example structure:

Default Sales Plan
0–35 days → 100%
36–60 days → 75%
61–90 days → 50%
91+ → 0%

Alternate plans may modify the day ranges or multiplier structure to accommodate specific business scenarios such as slow-pay customers.

Example:

60 Day Plan
0–60 days → 100%
61–75 days → 75%
76–90 days → 50%
91+ → 0%

These plans are reusable templates and are created and managed only from the Admin Commissions section.

### Global Default Plan

Exactly one CommissionPlan may be designated as the global default plan.

If no override exists at lower precedence levels, the resolver must use the global default plan.

### Job Order Commission Plan Selection

Job Orders may optionally select a CommissionPlan.

If a Job Order specifies a commissionPlanId, the CommissionResolverService must use that plan when calculating commissions for events generated from that order.

If the Job Order does not specify a plan, the resolver falls back to the global default plan.

### Resolver Precedence Update

The resolver precedence is now defined as:

1. Job Order commission plan override
2. Salesperson default commission plan (future capability)
3. Global default commission plan

Only the first and third levels are implemented in Phase 3.

### Job Order Restrictions

Phase 3 intentionally restricts Job Orders from creating custom payout tiers or editing commission math directly.

Job Orders may only select from existing Admin-managed CommissionPlans.

All commission plan definitions remain centralized in the Admin Commissions system.

### Architectural Intent

This design preserves:

- centralized commission logic
- reusable plan templates
- consistent payout behavior
- clean resolver precedence

while allowing Job Orders to accommodate customer-specific payment timelines such as slow-pay contracts.

