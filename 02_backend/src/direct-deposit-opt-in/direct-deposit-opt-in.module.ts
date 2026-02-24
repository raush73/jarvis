import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { MagicLinksModule } from "../magic-links/magic-links.module";
import { DirectDepositOptInService } from "./direct-deposit-opt-in.service";
import { PublicDirectDepositOptInController } from "./public-direct-deposit-opt-in.controller";

@Module({
  imports: [PrismaModule, MagicLinksModule],
  controllers: [PublicDirectDepositOptInController],
  providers: [DirectDepositOptInService],
})
export class DirectDepositOptInModule {}
