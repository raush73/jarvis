import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ToolTypesService } from "./tool-types.service";

@Controller("tool-types")
export class ToolTypesController {
  constructor(private readonly toolTypesService: ToolTypesService) {}

  @Get()
  findAll(@Query("activeOnly") activeOnly?: string) {
    const activeOnlyBool = activeOnly === "true" || activeOnly === "1";
    return this.toolTypesService.findAll({ activeOnly: activeOnlyBool });
  }

  @Post()
  create(@Body() body: { name: string }) {
    return this.toolTypesService.create({ name: body.name });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: { name?: string; isActive?: boolean }) {
    return this.toolTypesService.update(id, body);
  }

  // Hard delete allowed ONLY if not referenced elsewhere.
  // If referenced, Prisma will throw FK error (P2003) and we return 409 Conflict.
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string) {
    await this.toolTypesService.remove(id);
  }
}
