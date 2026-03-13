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
