import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type CreateSalespersonInput = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
};

type UpdateSalespersonInput = {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
};

@Injectable()
export class SalespeopleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.salesperson.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  private isProtected(record: {
    firstName: string;
    lastName: string;
    email: string | null;
  }) {
    const first = (record.firstName ?? "").trim().toLowerCase();
    const last = (record.lastName ?? "").trim().toLowerCase();
    const email = (record.email ?? "").trim().toLowerCase();

    // Protect House Account
    const isHouseAccount = first === "house" && last === "account";

    // Protect Michael (by name OR known email)
    const isMichael =
      (first === "michael" && last === "raushenberger") ||
      email === "mike@mw4h.com" ||
      email === "michael+demo@mw4h.com";

    return isHouseAccount || isMichael;
  }

  async findOne(id: string) {
    const record = await this.prisma.salesperson.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException("Salesperson not found");
    }

    return record;
  }

  async create(input: CreateSalespersonInput) {
    const { firstName, lastName, email, phone, isActive } = input;

    return this.prisma.salesperson.create({
      data: {
        firstName,
        lastName,
        email: email ?? null,
        phone: phone ?? null,
        isActive: isActive ?? true,
      },
    });
  }

  async update(id: string, input: UpdateSalespersonInput) {
    const existing = await this.findOne(id);

    // Only block deactivation attempts (do NOT block normal edits)
    if (input.isActive === false && this.isProtected(existing)) {
      throw new ForbiddenException("This salesperson cannot be deactivated.");
    }

    return this.prisma.salesperson.update({
      where: { id },
      data: {
        ...input,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.findOne(id);

    // DELETE is a deactivation in our system (soft)
    if (this.isProtected(existing)) {
      throw new ForbiddenException("This salesperson cannot be deactivated.");
    }

    return this.prisma.salesperson.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
