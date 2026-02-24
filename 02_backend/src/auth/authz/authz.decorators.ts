import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const SCOPES_KEY = 'scopes';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const Scopes = (...scopes: string[]) => SetMetadata(SCOPES_KEY, scopes);

