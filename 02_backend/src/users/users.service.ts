import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  

  async listSalespeople() {
    // "salespeople" = Users that have Role.name === "sales"
    return this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: { name: "sales" },
          },
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
      },
      orderBy: [{ fullName: "asc" }, { email: "asc" }],
    });
  }

  async listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
        roles: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignRole(userId: string, roleId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      update: {},
      create: {
        userId,
        roleId,
      },
    });
  }

  async unassignRole(userId: string, roleId: string) {
    try {
      return await this.prisma.userRole.delete({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException('User role assignment not found');
      }
      throw err;
    }
  }
}
