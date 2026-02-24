import { Injectable, Logger } from "@nestjs/common";
import { DialerProvider, PlaceCallInput } from "./dialer.provider";

@Injectable()
export class NullDialerProvider implements DialerProvider {
  readonly name = "NULL" as const;
  private readonly logger = new Logger(NullDialerProvider.name);

  async placeCall(input: PlaceCallInput) {
    this.logger.log(`[NULL DIALER] would call to=${input.to}`);
    return { ok: true as const, externalId: undefined };
  }
}
