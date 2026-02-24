import { Module } from "@nestjs/common";
import { EMAIL_PROVIDER } from "./email/email.provider";
import { SMS_PROVIDER } from "./sms/sms.provider";
import { DIALER_PROVIDER } from "./dialer/dialer.provider";
import { NullEmailProvider } from "./email/null-email.provider";
import { NullSmsProvider } from "./sms/null-sms.provider";
import { NullDialerProvider } from "./dialer/null-dialer.provider";

@Module({
  providers: [
    NullEmailProvider,
    NullSmsProvider,
    NullDialerProvider,

    // Default providers for Jarvis 1.0 = NULL (vendor-agnostic)
    { provide: EMAIL_PROVIDER, useExisting: NullEmailProvider },
    { provide: SMS_PROVIDER, useExisting: NullSmsProvider },
    { provide: DIALER_PROVIDER, useExisting: NullDialerProvider },
  ],
  exports: [EMAIL_PROVIDER, SMS_PROVIDER, DIALER_PROVIDER],
})
export class IntegrationsModule {}
