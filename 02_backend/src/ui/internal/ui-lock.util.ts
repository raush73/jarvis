export type UiLockCheckInput = {
  orderId: string;
  weekStart?: string; // YYYY-MM-DD (Monday), optional for UIs that don't use weekStart
};

export type UiLockMode = 'OFF' | 'WARN' | 'ENFORCE';

export type UiLockCheckResult = {
  locked: boolean;
  reason?: string;
  mode?: UiLockMode;
};

export const UI_LOCK_ERROR_CODE = 'JAR-LOCKED' as const;

export class UiLockedError extends Error {
  public readonly code = UI_LOCK_ERROR_CODE;

  constructor(public readonly reason: string) {
    super(reason);
    this.name = 'UiLockedError';
  }
}

function getUiLockMode(): UiLockMode {
  const raw = (process.env.JARVIS_UI_LOCK_MODE || 'OFF').toUpperCase();
  if (raw === 'WARN' || raw === 'ENFORCE' || raw === 'OFF') return raw;
  return 'OFF';
}

// NOTE (LOCKED INTENT):
// This is the SINGLE enforcement point for "contract lock" / "invoice lock" / "payroll lock" rules.
// UIs call this before render and before mutation.
// Today: still NO-OP (always unlocked) but now includes mode + structured logging so we can safely turn on later.
export async function assertUiUnlockedOrThrow(input: UiLockCheckInput): Promise<UiLockCheckResult> {
  const mode = getUiLockMode();

  // TODO (future): compute "locked" based on real rules (invoice approved, payroll packet exported, etc.)
  const locked = false;
  const reason = locked ? 'LOCKED_TBD' : undefined;

  if (locked) {
    const msg = `[UI-LOCK] locked=true mode=${mode} orderId=${input.orderId}${input.weekStart ? ` weekStart=${input.weekStart}` : ''} reason=${reason}`;
    if (mode === 'WARN') {
      // Warn-only: DO NOT block, just log.
      // eslint-disable-next-line no-console
      console.warn(msg);
      return { locked: false, mode, reason };
    }
    if (mode === 'ENFORCE') {
      // Enforce: block the UI action.
      // eslint-disable-next-line no-console
      console.warn(msg);
      throw new UiLockedError(reason || UI_LOCK_ERROR_CODE);
    }
  }

  return { locked: false, mode };
}
