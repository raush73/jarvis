import { Controller, Get, UseGuards, Delete, Post, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PERMISSIONS } from '../auth/permissions.constants';
import { UsersService } from './users.service';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(PERMISSIONS.USERS_READ)
  @Get('salespeople')
  async listSalespeople() {
    return this.usersService.listSalespeople();
  }

  // READ users
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(PERMISSIONS.USERS_READ)
  @Get()
  async listUsers() {
    return this.usersService.listUsers();
  }

  // ASSIGN role to user (admin action)
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(PERMISSIONS.ROLES_WRITE)
  @Post(':userId/roles/:roleId')
  async assignRole(@Param() params: { userId: string; roleId: string }) {
    return this.usersService.assignRole(params.userId, params.roleId);
  }

  // UNASSIGN role from user (admin action)
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(PERMISSIONS.ROLES_WRITE)
  @Delete(':userId/roles/:roleId')
  async unassignRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.usersService.unassignRole(userId, roleId);
  }
}
