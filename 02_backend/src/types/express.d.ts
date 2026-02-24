import type { JwtUser } from '../auth/types/jwt-user.type';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

