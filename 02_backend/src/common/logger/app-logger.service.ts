import { Injectable, Logger, Scope } from '@nestjs/common';
import { getRequestId } from '../request-context';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger {
  private logger = new Logger();
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  private formatMessage(message: string): string {
    const requestId = getRequestId();
    const prefix = requestId ? `[${requestId}]` : '';
    return `${prefix} ${message}`;
  }

  log(message: string, context?: string) {
    this.logger.log(this.formatMessage(message), context ?? this.context);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(this.formatMessage(message), trace, context ?? this.context);
  }

  warn(message: string, context?: string) {
    this.logger.warn(this.formatMessage(message), context ?? this.context);
  }

  debug(message: string, context?: string) {
    this.logger.debug(this.formatMessage(message), context ?? this.context);
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(this.formatMessage(message), context ?? this.context);
  }

  /** Log unhandled/server exceptions (5xx or non-HTTP errors) */
  logException(params: {
    errorId: string;
    requestId: string;
    method: string;
    url: string;
    user?: { id: string; email?: string };
    error: Error;
  }) {
    const { errorId, requestId, method, url, user, error } = params;
    const userInfo = user ? `user=${user.id}(${user.email ?? 'no-email'})` : 'user=anonymous';
    this.logger.error(
      `[${requestId}] UNHANDLED_EXCEPTION errorId=${errorId} ${method} ${url} ${userInfo}`,
      error.stack,
      'AllExceptionsFilter',
    );
  }

  /** Log auth errors (401/403/429) at warn level */
  logAuthError(params: {
    requestId: string;
    method: string;
    url: string;
    status: number;
    message: string;
  }) {
    const { requestId, method, url, status, message } = params;
    this.logger.warn(
      `[${requestId}] ${status} ${method} ${url} - ${message}`,
      'AllExceptionsFilter',
    );
  }
}

