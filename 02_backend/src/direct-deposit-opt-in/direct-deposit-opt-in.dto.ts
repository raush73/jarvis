import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";

export class DirectDepositOptInSubmitDto {
  @IsBoolean()
  wantsDirectDeposit!: boolean;

  @IsBoolean()
  wantsEtvDonation!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  etvAmountCents?: number;
}
