import { Module } from "@nestjs/common";
import { MagicController } from "./magic.controller";
import { MagicService } from "./magic.service";

@Module({
  controllers: [MagicController],
  providers: [MagicService],
})
export class MagicModule {}
