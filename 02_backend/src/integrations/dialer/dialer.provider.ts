import { IntegrationProviderName } from "../common/integration.types";

export const DIALER_PROVIDER = Symbol("DIALER_PROVIDER");

export interface PlaceCallInput {
  to: string;
  from?: string;
  // future: recording flags, call routing, agentId, etc.
}

export interface DialerProvider {
  readonly name: IntegrationProviderName;
  placeCall(input: PlaceCallInput): Promise<{ ok: true; externalId?: string } | { ok: false; error: string }>;
}
