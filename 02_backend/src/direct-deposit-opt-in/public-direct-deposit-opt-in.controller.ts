import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  ForbiddenException,
  ConflictException,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { MagicLinksService } from "../magic-links/magic-links.service";
import { MagicLinkError, mapMagicLinkErrorToHttpException } from "../magic-links/magic-link.errors";
import { DirectDepositOptInService } from "./direct-deposit-opt-in.service";
import { DirectDepositOptInSubmitDto } from "./direct-deposit-opt-in.dto";

@Controller("public/direct-deposit-opt-in")
export class PublicDirectDepositOptInController {
  constructor(
    private readonly magicLinks: MagicLinksService,
    private readonly service: DirectDepositOptInService,
  ) {}

  /**
   * Multi-open: validate token and return minimal payload for rendering.
   */
  @Get()
  async view(@Query("token") token: string) {
    if (!token) throw new ForbiddenException("Missing token");

    let link: any;
    try {
      link = await this.magicLinks.validateOrThrow({
        token,
        scope: "DIRECT_DEPOSIT_OPT_IN",
      });
    } catch (e: any) {
      if (e instanceof MagicLinkError) {
        throw mapMagicLinkErrorToHttpException(e.code, "view");
      }
      throw new ForbiddenException("Invalid link.");
    }

    if (!link.userId) {
      throw new ForbiddenException("Invalid magic link (no user)");
    }

    return {
      ok: true,
      userId: link.userId,
      expiresAt: link.expiresAt,
    };
  }

  /**
   * Single-submit: consume token and persist opt-in submission.
   */
  @Post("submit")
  async submit(
    @Query("token") token: string,
    @Body() dto: DirectDepositOptInSubmitDto,
    @Req() req: Request,
  ) {
    if (!token) throw new ForbiddenException("Missing token");

    let link: any;
    try {
      link = await this.magicLinks.consumeOrThrow({
        token,
        scope: "DIRECT_DEPOSIT_OPT_IN",
      });
    } catch (e: any) {
      if (e instanceof MagicLinkError) {
        throw mapMagicLinkErrorToHttpException(e.code, "respond");
      }
      throw new ForbiddenException("Invalid link.");
    }

    if (!link.userId) {
      throw new ForbiddenException("Invalid magic link (no user)");
    }

    try {
      await this.service.createSubmission({
        employeeId: link.userId,
        magicLinkId: link.id,
        dto,
        majorEdVideoUrl: null,
      });
    } catch (e: any) {
      throw new ConflictException("Submission already recorded.");
    }

    return { ok: true };
  }
}
