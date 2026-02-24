import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { getRequestContext } from '../request-context';
import { AppLogger } from '../logger/app-logger.service';

function generateErrorId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(6);
  let result = 'JAR-';
  for (let i = 0; i < 6; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('AllExceptionsFilter');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const context = getRequestContext();
    const requestId = context?.requestId ?? 'unknown';
    const errorId = generateErrorId();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttpException
      ? this.extractMessage(exception)
      : 'Internal server error';

    // Logging rules:
    // - 5xx or non-HttpException: log as UNHANDLED_EXCEPTION with stack
    // - 401/403/429: log at warn level
    // - Other 4xx (including 404): do not log
    if (!isHttpException || status >= 500) {
      this.logger.logException({
        errorId,
        requestId,
        method: request.method,
        url: request.url,
        user: context?.user,
        error: exception instanceof Error ? exception : new Error(String(exception)),
      });
    } else if (status === 401 || status === 403 || status === 429) {
      this.logger.logAuthError({
        requestId,
        method: request.method,
        url: request.url,
        status,
        message,
      });
    }
    // 404 and other 4xx: no logging

    response.status(status).json({
      ok: false,
      errorId,
      requestId,
      message,
    });
  }

  private extractMessage(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === 'string') {
      return response;
    }
    if (typeof response === 'object' && response !== null && 'message' in response) {
      const msg = (response as any).message;
      return Array.isArray(msg) ? msg.join(', ') : String(msg);
    }
    return 'An error occurred';
  }
}

