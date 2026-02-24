import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DirectDepositOptInSubmitDto } from "./direct-deposit-opt-in.dto";

@Injectable()
export class DirectDepositOptInService {
  constructor(private readonly prisma: PrismaService) {}

  async createSubmission(params: {
    employeeId: string;
    magicLinkId: string | null;
    dto: DirectDepositOptInSubmitDto;
    majorEdVideoUrl: string | null;
  }) {
    const { employeeId, magicLinkId, dto, majorEdVideoUrl } = params;

    return this.prisma.directDepositOptInSubmission.create({
      data: {
        employeeId,
        magicLinkId,
        wantsDirectDeposit: dto.wantsDirectDeposit,
        wantsEtvDonation: dto.wantsEtvDonation,
        etvAmountCents: dto.etvAmountCents ?? null,
        majorEdVideoUrl,
        status: "SUBMITTED",
      },
    });
  }
}
