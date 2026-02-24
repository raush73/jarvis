import { IntegrationProviderName } from "../common/integration.types";

export const SMS_PROVIDER = Symbol("SMS_PROVIDER");

export interface SendSmsInput {
  to: string;
  body: string;
  from?: string;
}

export interface SmsProvider {
  readonly name: IntegrationProviderName;
  send(input: SendSmsInput): Promise<{ ok: true; externalId?: string } | { ok: false; error: string }>;
}
