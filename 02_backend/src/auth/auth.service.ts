import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { resolveEffectivePermissions } from './permissions.resolver';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.create({
      data: {
        email,
        hashedPassword,
      },
    });

    return { ok: true, action: 'register', email };
  }

  async login(dto: LoginDto) {
    const emailRaw = dto?.email;
    const passwordRaw = dto?.password;

    if (typeof emailRaw !== 'string' || emailRaw.trim() === '') {
      throw new BadRequestException('email is required');
    }
    if (typeof passwordRaw !== 'string' || passwordRaw.trim() === '') {
      throw new BadRequestException('password is required');
    }

    const email = dto.email.trim().toLowerCase();

    let user;
    try {
      user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          hashedPassword: true,
          isActive: true,
        },
      });
    } catch (err: any) {
      // Prisma connection errors (ETIMEDOUT, etc.) → 503
      if (err?.code === 'P1001' || err?.message?.includes('ETIMEDOUT')) {
        throw new ServiceUnavailableException('DB unavailable');
      }
      throw err;
    }

    // Deterministic 401 on invalid creds (no user enumeration)
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Optional: block inactive accounts (Jarvis 1.0 behavior)
    if (user.isActive === false) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password, user.hashedPassword);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    let roles: string[];
    let permissions: string[];
    try {
      const resolved = await resolveEffectivePermissions(this.prisma, user.id);
      roles = resolved.roles;
      permissions = resolved.permissions;
    } catch (err: any) {
      if (err?.code === 'P1001' || err?.message?.includes('ETIMEDOUT')) {
        throw new ServiceUnavailableException('DB unavailable');
      }
      throw err;
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      roles,
      permissions,
    });

    return {
      ok: true,
      action: 'login',
      accessToken,
    };
  }

  /**
   * DEV ONLY — issue JWT for UI demo without DB access
   */
  async devUiDemoLogin() {
    const accessToken = await this.jwt.signAsync({
      sub: 'dev-demo-user',
      email: 'demo@jarvis.dev',
      roles: ['admin'],
      permissions: [],
    });

    return {
      ok: true,
      action: 'devUiDemoLogin',
      accessToken,
    };
  }

  /**
   * DEV ONLY â€” grant admin role to a userId
   * Guarded by:
   * - NODE_ENV must be 'development'
   * - ALLOW_DEV_ADMIN must be 'true'
   */
  async devGrantAdminRole(userId: string) {
    if (process.env.NODE_ENV !== 'development') {
      throw new ForbiddenException('DEV endpoint disabled');
    }

    if (process.env.ALLOW_DEV_ADMIN !== 'true') {
      throw new ForbiddenException('DEV admin grant is disabled');
    }

    const role = await this.prisma.role.upsert({
      where: { name: 'admin' },
      create: { name: 'admin', description: 'DEV seeded admin role' },
      update: {},
      select: { id: true, name: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) throw new BadRequestException('User not found');

    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      create: { userId, roleId: role.id },
      update: {},
    });

    return { ok: true, action: 'devGrantAdminRole', userId };
  }
}
