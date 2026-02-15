import type { FingerprintSummary } from './fingerprint-errors';

export type Severity = 'HIGH' | 'MED' | 'LOW';

export function classifySeverity(fingerprint: FingerprintSummary): Severity {
  const sampleText = [
    fingerprint.errorName,
    fingerprint.message,
    fingerprint.example.lines.join(' '),
  ]
    .join(' ')
    .toLowerCase();

  if (
    /unhandled|uncaught|panic|fatal/.test(sampleText) ||
    /auth|unauthorized|forbidden|jwt|token|session/.test(sampleText) ||
    /prisma|database|db|sequelize|mongo|redis/.test(sampleText) &&
      /fail|error|refused|timeout|unavailable/.test(sampleText) ||
    /\b5\d\d\b/.test(sampleText) ||
    /internal server error/.test(sampleText)
  ) {
    return 'HIGH';
  }

  if (
    /validation|bad request|unprocessable|not found|endpoint/.test(sampleText) ||
    /\b4\d\d\b/.test(sampleText)
  ) {
    return 'MED';
  }

  if (/warn|deprecated/.test(sampleText)) {
    return 'LOW';
  }

  return 'MED';
}
