# BUILD CAPSULES — Scoped Work Units

## What Is a Build Capsule?

A **Build Capsule** is a locked, self-contained work unit.

- Defines exactly which files may be created/modified
- Defines endpoints and contracts
- Defines DONE criteria
- Is the **sole authority** for that scope

Capsules live in: `governance/CAPSULES/<NAME>.md`

---

## STOP/KEEP Gates

All capsule work follows this flow:

1. Axel proposes a change (diff preview)
2. Axel outputs: `STOP — Waiting for KEEP`
3. Michael reviews
4. Michael types `KEEP` to approve OR rejects
5. Only after `KEEP` does Axel apply the change

**No silent writes. No batch applies.**

---

## File Whitelist Rule

Each capsule declares an **Allowed Files** list.

- Axel may ONLY touch files on that list
- Any file not on the list is **forbidden**
- Violating this = session reset

---

## No Opportunistic Cleanup

- No refactors outside scope
- No "while I'm here" fixes
- No schema/prisma/migration changes unless capsule explicitly allows
- No touching adjacent modules

---

## Minimal Gate Checks

Before marking a capsule DONE, verify:

1. `npm run check:bom` — passes
2. Remove dist folder
3. `npm run build:checked` — exits 0
4. Artifact verify — required files exist in `dist/`

---

## Capsule Template

New capsules MUST include these headings:

```
# <CAPSULE-NAME> — <Short Purpose>

## Purpose
## Domain Locks
## Endpoints
## Allowed Files
## Forbidden Actions
## DONE Criteria
```

---

## Authority

The capsule file is the **single source of truth** for:

- What files can be touched
- What endpoints/contracts apply
- When work is considered complete

If governance docs conflict, the capsule wins for its scope.

