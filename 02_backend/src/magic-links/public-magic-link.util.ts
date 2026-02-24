import { ForbiddenException } from '@nestjs/common';
import { MagicLinksService, MagicLinkScope } from './magic-links.service';
import {
  MagicLinkError,
  mapMagicLinkErrorToHttpException,
} from './magic-link.errors';

export async function validatePublicMagicLink(params: {
  magicLinks: MagicLinksService;
  token: string;
  scope: MagicLinkScope;
}) {
  const { magicLinks, token, scope } = params;

  if (!token) throw new ForbiddenException('Missing token');

  try {
    return await magicLinks.validateOrThrow({ token, scope });
  } catch (e: any) {
    if (e instanceof MagicLinkError) {
      throw mapMagicLinkErrorToHttpException(e.code, 'view');
    }
    throw new ForbiddenException('Invalid link.');
  }
}

export async function consumePublicMagicLink(params: {
  magicLinks: MagicLinksService;
  token: string;
  scope: MagicLinkScope;
}) {
  const { magicLinks, token, scope } = params;

  if (!token) throw new ForbiddenException('Missing token');

  try {
    return await magicLinks.consumeOrThrow({ token, scope });
  } catch (e: any) {
    if (e instanceof MagicLinkError) {
      throw mapMagicLinkErrorToHttpException(e.code, 'respond');
    }
    throw new ForbiddenException('Invalid link.');
  }
}
