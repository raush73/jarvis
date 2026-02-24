import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

export function AdminOnly() {
  return applyDecorators(
    UseGuards(AuthGuard('jwt'), RolesGuard),
    Roles('admin'),
  );
}
