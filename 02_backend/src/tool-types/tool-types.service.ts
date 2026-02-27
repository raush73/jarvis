import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ToolTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(opts: { activeOnly?: boolean }) {
    const where = opts.activeOnly ? { isActive: true } : undefined;
    return this.prisma.toolType.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async create(input: { name: string }) {
    return this.prisma.toolType.create({
      data: {
        name: input.name?.trim(),
        isActive: true,
      },
    });
  }

  async update(id: string, input: { name?: string; isActive?: boolean }) {
    return this.prisma.toolType.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
  }

  async remove(id: string) {
    try {
      await this.prisma.toolType.delete({ where: { id } });
      return;
    } catch (e: any) {
      // Not found
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw new NotFoundException("Tool type not found.");
      }

      // FK constraint violation => referenced somewhere => do not delete
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
        throw new ConflictException("Tool type is in use and cannot be deleted. Deactivate it instead.");
      }

      throw e;
    }
  }
}
