import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // UI-16 demo mode bypass (non-production only, no token required)
    const demoReq = context.switchToHttp().getRequest();
    const demoPath = demoReq.originalUrl ?? demoReq.url ?? '';
    if (
      process.env.NODE_ENV !== 'production' &&
      String(process.env.UI_DEMO_MODE).toLowerCase() === 'true' &&
      demoPath.startsWith('/ui/internal/ui16')
    ) {
      return true;
    }

    // Check @Public() decorator first
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // Path-based public route exclusion
    const request = context.switchToHttp().getRequest();
    const path = request.url?.split('?')[0] || '';

    if (this.isPublicPath(path)) {
      return true;
    }

    // Extract and verify JWT
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      // Attach decoded payload to request
      request.user = {
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles ?? [],
        permissions: payload.permissions ?? [],
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers?.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token ? token : null;
  }

  private isPublicPath(path: string): boolean {
    // Exact public paths
    if (path === '/health' || path === '/auth/login' || path === '/auth/register') {
      return true;
    }

    // Prefix-based matching for magic links
    if (path.startsWith('/magic/')) {
      return true;
    }

    return false;
  }
}

