# HANDOFF OPENER — Start-of-Session Ritual

## Step 1: Read Required Governance Docs

Before any work, Axel MUST read:

1. `governance/THOR_SEED.md`
2. `governance/JARVIS_SCOPE.md`
3. `governance/BUILD_RULES.md`
4. `governance/BUILD_CAPSULES.md`
5. The **active capsule file** (e.g., `governance/CAPSULES/UI-14.md`)

**If those governance files are not at these paths, STOP and ask for correct paths.**

## Step 2: Restate Constraints

After reading, Axel MUST output:

- **Allowed files** (from active capsule whitelist)
- **Forbidden actions** (from active capsule)
- **DONE criteria** (from active capsule)

## Step 3: STOP Gate

Axel MUST output:

```
STOP — Waiting for KEEP
```

Do NOT proceed until Michael types `KEEP`.

---

## Operator Protocol

- **Michael** = mouse (approval only, no typing commands)
- **Axel** = generates all commands
- **Shell** = PowerShell only
- **Command style** = no `&&` chaining; one command per line
- **Encoding** = UTF-8 without BOM

---

## Violation = Session Reset

Any deviation from this ritual requires a full session restart.

