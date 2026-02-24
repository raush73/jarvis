import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Authenticated identity (used by frontend after login)
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Req() req: any) {
    const u = req?.user;
    if (!u) return { ok: false, error: 'UNAUTHENTICATED' };

    const roles = Array.isArray(u.roles)
      ? u.roles
          .map((r: any) => (typeof r === 'string' ? r : r?.role?.name ?? r?.name))
          .filter(Boolean)
      : [];

    return {
      ok: true,
      user: {
        id: u.id,
        email: u.email,
        fullName: u.fullName ?? null,
        roles,
      },
    };
  }

  /**
   * DEV ONLY — issue JWT for UI demo without DB access
   * Returns 404 in production
   */
  @Get('dev/ui-demo-login')
  devUiDemoLogin() {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    return this.authService.devUiDemoLogin();
  }

  /**
   * DEV ONLY — grant admin role to a userId
   * Guarded by ALLOW_DEV_ADMIN=true
   */
  @Post('dev/grant-admin/:userId')
  async devGrantAdmin(@Param('userId') userId: string) {
    if (process.env.NODE_ENV !== 'development') {
      throw new ForbiddenException('DEV endpoint disabled');
    }

    if (process.env.ALLOW_DEV_ADMIN !== 'true') {
      throw new ForbiddenException('DEV admin grant is disabled');
    }

    return this.authService.devGrantAdminRole(userId);
  }
}
