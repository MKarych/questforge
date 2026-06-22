import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        message = (res as any).message || message;
        code = (res as any).code || code;
        details = (res as any).details;
      }
    } else if (exception instanceof BadRequestException && exception.getResponse() as any) {
      const res = exception.getResponse() as any;
      status = HttpStatus.BAD_REQUEST;
      message = res.message || 'Ошибка валидации';
      code = 'VALIDATION_ERROR';
      if (Array.isArray(res.message)) {
        details = { messages: res.message };
      }
      this.logger.warn(`Validation error: ${message}`);
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message: this.translateMessage(message),
        details,
      },
    });
  }

  private translateMessage(message: string): string {
    // Simple translation map for common validation errors
    const translations: Record<string, string> = {
      'Password must be longer than or equal to 6 characters': 'Пароль должен быть длиннее или равен 6 символам',
      'Invalid credentials': 'Неверные учетные данные',
      'Email already registered': 'Email уже зарегистрирован',
      'User not found': 'Пользователь не найден',
      'Invalid refresh token': 'Неверный токен обновления',
      'Invalid token type': 'Неверный тип токена',
      'Logged out successfully': 'Успешный выход',
    };

    return translations[message] || message;
  }
}
