import { Module } from "@nestjs/common";
import { PrismaModule } from "../../../prisma/prisma.module";
import { Ui13Controller } from "./ui13.controller";
import { Ui13VettingService } from "../services/ui13-vetting.service";

@Module({
  imports: [PrismaModule],
  controllers: [Ui13Controller],
  providers: [Ui13VettingService],
})
export class Ui13Module {}
