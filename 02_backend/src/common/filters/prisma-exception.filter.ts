import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
  } from '@nestjs/common';
  import { Prisma } from '@prisma/client';
  
  @Catch(Prisma.PrismaClientKnownRequestError)
  export class PrismaExceptionFilter implements ExceptionFilter {
    catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
  
      // Prisma error codes reference:
      // https://www.prisma.io/docs/reference/api-reference/error-reference
      switch (exception.code) {
        case 'P2002': {
          // Unique constraint failed
          return response.status(HttpStatus.CONFLICT).json({
            statusCode: HttpStatus.CONFLICT,
            message: 'Unique constraint violation',
            prismaCode: exception.code,
          });
        }
  
        case 'P2025': {
          // Record not found
          return response.status(HttpStatus.NOT_FOUND).json({
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Record not found',
            prismaCode: exception.code,
          });
        }
  
        default: {
          return response.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Database error',
            prismaCode: exception.code,
          });
        }
      }
    }
  }
  