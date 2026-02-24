import { Injectable, Logger } from "@nestjs/common";
import { EmailProvider, SendEmailInput } from "./email.provider";

@Injectable()
export class NullEmailProvider implements EmailProvider {
  readonly name = "NULL" as const;
  private readonly logger = new Logger(NullEmailProvider.name);

  async send(input: SendEmailInput) {
    this.logger.log(
      `[NULL EMAIL] would send to=${JSON.stringify(input.to)} subject=${input.subject}`,
    );
    return { ok: true as const, externalId: undefined };
  }
}
