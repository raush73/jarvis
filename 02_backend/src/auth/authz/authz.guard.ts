import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtUser } from '../types/jwt-user.type';
import { ROLES_KEY, SCOPES_KEY } from './authz.decorators';
import { hasAnyRole, hasAnyScope } from './authz.util';

@Injectable()
export class AuthzGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No metadata → allow
    if (!requiredRoles && !requiredScopes) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtUser | undefined = request.user;

    // Check roles if specified
    if (requiredRoles && requiredRoles.length > 0) {
      if (!hasAnyRole(user, requiredRoles)) {
        throw new ForbiddenException('Insufficient role');
      }
    }

    // Check scopes if specified
    if (requiredScopes && requiredScopes.length > 0) {
      if (!hasAnyScope(user, requiredScopes)) {
        throw new ForbiddenException('Insufficient scope');
      }
    }

    return true;
  }
}

