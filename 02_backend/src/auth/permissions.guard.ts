import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // What permissions does this route require?
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    // If route doesn't require permissions, allow
    if (requiredPermissions.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // No user -> deny
    if (!user) return false;

    // ✅ DEV + PROD RULE: "admin" is a superuser bypass
    // Normalize roles to lowercase to avoid "ADMIN" vs "admin" mismatch
    const roles: string[] = Array.isArray(user.roles)
      ? user.roles
          .map((r: any) => (typeof r === 'string' ? r : r?.name))
          .filter(Boolean)
          .map((r: any) => String(r).toLowerCase())
      : [];

    if (roles.includes('admin')) return true;

    // Normal permission check
    const userPerms: string[] = Array.isArray(user.permissions)
      ? user.permissions
      : [];

    return requiredPermissions.every((p) => userPerms.includes(p));
  }
}
