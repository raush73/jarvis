import { Injectable, Logger } from "@nestjs/common";
import { SmsProvider, SendSmsInput } from "./sms.provider";

@Injectable()
export class NullSmsProvider implements SmsProvider {
  readonly name = "NULL" as const;
  private readonly logger = new Logger(NullSmsProvider.name);

  async send(input: SendSmsInput) {
    this.logger.log(`[NULL SMS] would send to=${input.to} body="${input.body}"`);
    return { ok: true as const, externalId: undefined };
  }
}
