export type AuthState = {
  isAuthenticated: boolean;
  demoTitle: string;
};

/**
 * Placeholder auth hook (UI-only).
 * This is intentionally hard-coded for demo mode.
 * Future wiring will replace the values here without touching feature pages.
 */
export function useAuth(): AuthState {
  return {
    isAuthenticated: false,
    demoTitle: "Demo mode - sign in required",
  };
}

