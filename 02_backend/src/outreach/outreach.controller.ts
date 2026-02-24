import { Body, Controller, Post } from "@nestjs/common";
import { OutreachService } from "./outreach.service";
import { OutreachMessageDto } from "./dto/outreach-message.dto";

@Controller("outreach")
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) {}

  @Post("send")
  async send(@Body() dto: OutreachMessageDto) {
    return this.outreachService.send(dto);
  }
}
