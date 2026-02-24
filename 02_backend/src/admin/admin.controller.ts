import { Body, Controller, Post, UseGuards, Param, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminOnly } from '../auth/admin-only.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { LinkUserCustomerDto } from './dto/link-user-customer.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------
  // Seed permissions (idempotent)
  // --------------------------------------------------
  @Post('seed-permissions')
  @AdminOnly()
  async seedPermissions() {
    const permissions = [
      { key: 'companies.read' },
      { key: 'companies.write' },
      { key: 'companySignals.read' },
      { key: 'companySignals.write' },
      { key: 'callLogs.read' },
      { key: 'callLogs.write' },
      { key: 'orders.read' },
      { key: 'orders.write' },
      { key: 'customers.read' },
      { key: 'customers.write' },
      { key: 'hours.read.all' },
      { key: 'hours.read.self' },
      { key: 'customer.portal.access' },
      { key: 'orders.read.customer' },
      { key: 'hours.read.customer' },
      { key: 'hours.approve.customer' },
      { key: 'invoices.read.customer' },
      { key: 'payments.read.customer' },
      { key: 'commissions.read' },
      { key: 'commissions.write' },
      { key: 'commissions.export' },
    ];

    for (const p of permissions) {
      await this.prisma.permission.upsert({
        where: { key: p.key },
        update: {},
        create: { key: p.key },
      });
    }

    const count = await this.prisma.permission.count();
    return { ok: true, totalPermissions: count };
  }

  // --------------------------------------------------
  // Grant CallLogs permissions to admin role
  // --------------------------------------------------
  @Post('grant-calllogs-to-role')
  @AdminOnly()
  async grantCallLogsToRole() {
    const roleName = 'admin';

    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return { ok: false, error: `Role not found: ${roleName}` };
    }

    const keys = ['callLogs.read', 'callLogs.write'];

    const perms = await this.prisma.permission.findMany({
      where: { key: { in: keys } },
      select: { id: true, key: true },
    });

    if (perms.length !== keys.length) {
      return {
        ok: false,
        error: 'Missing permissions',
        found: perms.map(p => p.key),
      };
    }

    for (const p of perms) {
      await this.prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: p.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: p.id,
        },
      });
    }

    return { ok: true, role: roleName, granted: keys };
  }

  // --------------------------------------------------
  // Grant Orders permissions to admin role
  // --------------------------------------------------
  @Post('grant-orders-to-role')
  @AdminOnly()
  async grantOrdersToRole() {
    const roleName = 'admin';

    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return { ok: false, error: `Role not found: ${roleName}` };
    }

    const keys = ['orders.read', 'orders.write'];

    const perms = await this.prisma.permission.findMany({
      where: { key: { in: keys } },
      select: { id: true, key: true },
    });

    if (perms.length !== keys.length) {
      return {
        ok: false,
        error: 'Missing permissions',
        found: perms.map(p => p.key),
      };
    }

    for (const p of perms) {
      await this.prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: p.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: p.id,
        },
      });
    }

    return { ok: true, role: roleName, granted: keys };
  }

  // --------------------------------------------------
  // Grant Customers permissions to admin role
  // --------------------------------------------------
  @Post('grant-customers-to-role')
  @AdminOnly()
  async grantCustomersToRole() {
    const roleName = 'admin';

    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return { ok: false, error: `Role not found: ${roleName}` };
    }

    const keys = ['customers.read', 'customers.write'];

    const perms = await this.prisma.permission.findMany({
      where: { key: { in: keys } },
      select: { id: true, key: true },
    });

    if (perms.length !== keys.length) {
      return {
        ok: false,
        error: 'Missing permissions',
        found: perms.map(p => p.key),
      };
    }

    for (const p of perms) {
      await this.prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: p.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: p.id,
        },
      });
    }

    return { ok: true, role: roleName, granted: keys };
  }

  // --------------------------------------------------
  // Grant Customer Portal permissions to customer role
  // --------------------------------------------------
  @Post('grant-customer-portal-to-role')
  @AdminOnly()
  async grantCustomerPortalToRole() {
    const roleName = 'customer';

    const role = await this.prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
      select: { id: true, name: true },
    });

    const keys = [
      'customer.portal.access',
      'orders.read.customer',
      'hours.read.customer',
      'hours.approve.customer',
      'invoices.read.customer',
      'payments.read.customer',
    ];

    const perms = await this.prisma.permission.findMany({
      where: { key: { in: keys } },
      select: { id: true, key: true },
    });

    if (perms.length !== keys.length) {
      return {
        ok: false,
        error: 'Missing permissions',
        found: perms.map(p => p.key),
      };
    }

    for (const p of perms) {
      await this.prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: p.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: p.id,
        },
      });
    }

    return { ok: true, roleName: role.name, roleId: role.id, granted: keys };
  }

  // --------------------------------------------------
  // Grant admin role to phase2test1@mw4h.com
  // --------------------------------------------------
  @Post('grant-admin-to-phase2test1')
  @AdminOnly()
  async grantAdminToPhase2Test1() {
    const email = 'phase2test1@mw4h.com';

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return { ok: false, error: `User not found: ${email}` };
    }

    const role = await this.prisma.role.findUnique({
      where: { name: 'admin' },
      select: { id: true },
    });

    if (!role) {
      return { ok: false, error: 'Role not found: admin' };
    }

    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });

    return { ok: true, userId: user.id, roleId: role.id };
  }

  // --------------------------------------------------
  // Assign customer role to a specific userId
  // --------------------------------------------------
  @Post('assign-customer-role')
  @AdminOnly()
  async assignCustomerRole(@Body() body: { userId: string }) {
    const { userId } = body;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return { ok: false, error: `User not found: ${userId}` };
    }

    const role = await this.prisma.role.upsert({
      where: { name: 'customer' },
      update: {},
      create: { name: 'customer' },
      select: { id: true, name: true },
    });

    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });

    return { ok: true, userId: user.id, roleName: role.name, roleId: role.id };
  }

  // --------------------------------------------------
  // Grant hours.resolve.rejected permission to admin role
  // --------------------------------------------------
  @Post('grant-hours-resolve-rejected-to-admin')
  @AdminOnly()
  async grantHoursResolveRejectedToAdmin() {
    const roleName = 'admin';
    const permissionKey = 'hours.resolve.rejected';

    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
      select: { id: true, name: true },
    });

    if (!role) {
      return { ok: false, error: `Role not found: ${roleName}` };
    }

    // Upsert permission (self-healing: create if missing)
    const permission = await this.prisma.permission.upsert({
      where: { key: permissionKey },
      update: {},
      create: {
        key: permissionKey,
        description: 'Resolve rejected hours entries',
      },
      select: { id: true, key: true },
    });

    // Upsert RolePermission linking admin role + permission
    await this.prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });

    return { ok: true, roleId: role.id, permissionKey: permission.key };
  }

  // --------------------------------------------------
  // Link/Unlink User to Customer (Phase 11.B - Step 5)
  // --------------------------------------------------
  @Post('users/:userId/customer')
  @AdminOnly()
  async linkUserToCustomer(
    @Param('userId') userId: string,
    @Body() dto: LinkUserCustomerDto,
  ) {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    // Validate customerId if non-null
    if (dto.customerId !== null && dto.customerId !== undefined) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
        select: { id: true },
      });

      if (!customer) {
        throw new NotFoundException(`Customer not found: ${dto.customerId}`);
      }
    }

    // Update User.customerId
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { customerId: dto.customerId || null },
      select: { id: true, customerId: true },
    });

    return { ok: true, userId: updated.id, customerId: updated.customerId };
  }
}

