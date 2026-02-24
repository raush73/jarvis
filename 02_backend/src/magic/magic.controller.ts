import { Body, Controller, Get, HttpCode, Param, Post, Header } from "@nestjs/common";
import { MagicService } from "./magic.service";
import type { TimesheetApprovalSubmitDto } from "./dto/timesheet-approval-submit.dto";

@Controller("magic")
export class MagicController {
  constructor(private readonly magicService: MagicService) {}

  // UI-1: Customer Timesheet Approval (Magic Link Page)
  @Get("timesheet-approval/:token")
  async getTimesheetApprovalState(@Param("token") token: string) {
    return this.magicService.getTimesheetApprovalState(token);
  }

  // UI-1: Submit approval / rejection (Magic Link)
  @Post("timesheet-approval/:token")
  @HttpCode(200)
  async submitTimesheetApproval(
    @Param("token") token: string,
    @Body() body: TimesheetApprovalSubmitDto
  ) {
    return this.magicService.submitTimesheetApproval(token, body);
  }

  // UI-1: Mobile-first HTML page (presentation only)
  @Get("timesheet-approval/:token/ui")
  @Header("Content-Type", "text/html; charset=utf-8")
  async renderTimesheetApprovalPage(@Param("token") token: string) {
    return this.magicService.renderTimesheetApprovalPage(token);
  }
}


