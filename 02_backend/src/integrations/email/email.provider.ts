import { IntegrationProviderName } from "../common/integration.types";

export const EMAIL_PROVIDER = Symbol("EMAIL_PROVIDER");

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailProvider {
  readonly name: IntegrationProviderName;
  send(input: SendEmailInput): Promise<{ ok: true; externalId?: string } | { ok: false; error: string }>;
}
