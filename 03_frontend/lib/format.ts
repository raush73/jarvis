/**
 * Formats a digits-only phone string into US format: (XXX) XXX-XXXX
 * Returns the original value unmodified if input is missing, malformed, or not 10 digits.
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return value ?? "";
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 10) return value;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
