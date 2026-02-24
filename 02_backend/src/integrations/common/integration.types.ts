export type IntegrationProviderName =
  | "NULL"
  | "TWILIO"
  | "SENDGRID"
  | "MAILGUN"
  | "SALESLOFT"
  | "RINGCENTRAL"
  | "CUSTOM";

export interface IntegrationResult {
  ok: boolean;
  provider: IntegrationProviderName;
  externalId?: string;
  message?: string;
  meta?: Record<string, any>;
}

export function okResult(
  provider: IntegrationProviderName,
  message?: string,
  meta?: Record<string, any>,
  externalId?: string,
): IntegrationResult {
  return { ok: true, provider, message, meta, externalId };
}

export function failResult(
  provider: IntegrationProviderName,
  message: string,
  meta?: Record<string, any>,
): IntegrationResult {
  return { ok: false, provider, message, meta };
}
