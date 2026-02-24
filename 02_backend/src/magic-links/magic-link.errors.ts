import { ForbiddenException, ConflictException } from '@nestjs/common';

export type MagicLinkErrorCode =
  | 'NOT_FOUND'
  | 'INVALID_SCOPE'
  | 'EXPIRED'
  | 'USED';

export class MagicLinkError extends Error {
  constructor(
    public readonly code: MagicLinkErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'MagicLinkError';
  }
}

/**
 * Maps MagicLinkError code to NestJS HTTP exception for public endpoints.
 * Context determines how 'USED' is mapped:
 * - 'view': ForbiddenException('This link has already been used.')
 * - 'respond': ConflictException('Response already submitted.')
 */
export function mapMagicLinkErrorToHttpException(
  code: MagicLinkErrorCode,
  context: 'view' | 'respond',
): ForbiddenException | ConflictException {
  if (code === 'EXPIRED') {
    return new ForbiddenException('This link has expired.');
  }
  if (code === 'USED') {
    if (context === 'view') {
      return new ForbiddenException('This link has already been used.');
    } else {
      // context === 'respond'
      return new ConflictException('Response already submitted.');
    }
  }
  // NOT_FOUND / INVALID_SCOPE
  return new ForbiddenException('Invalid link.');
}
