import { Body, Controller, Get, Post, Param, Patch, Delete } from "@nestjs/common";
import { SalespeopleService } from "./salespeople.service";

type CreateSalespersonBody = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
};

type UpdateSalespersonBody = {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
};

@Controller("salespeople")
export class SalespeopleController {
  constructor(private readonly salespeopleService: SalespeopleService) {}

  @Get()
  findAll() {
    return this.salespeopleService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.salespeopleService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateSalespersonBody) {
    return this.salespeopleService.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateSalespersonBody) {
    return this.salespeopleService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.salespeopleService.remove(id);
  }
}
