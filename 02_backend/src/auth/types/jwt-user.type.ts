/**
 * Canonical JWT user payload type.
 * Types only — no runtime code.
 */
export interface JwtUser {
  /** Subject identifier (user ID) */
  sub: string;

  /** User email address */
  email?: string;

  /** User roles */
  roles?: string[];

  /** Permission scopes */
  scopes?: string[];

  /** Associated employee ID */
  employeeId?: string;

  /** Associated customer ID */
  customerId?: string;
}

