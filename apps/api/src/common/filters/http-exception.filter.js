"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let code = 'INTERNAL_ERROR';
        let details;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'string') {
                message = res;
            }
            else if (res && typeof res === 'object') {
                message = res.message || message;
                code = res.code || code;
                details = res.details;
            }
        }
        else if (exception instanceof common_1.BadRequestException && exception.getResponse()) {
            const res = exception.getResponse();
            status = common_1.HttpStatus.BAD_REQUEST;
            message = res.message || 'Ошибка валидации';
            code = 'VALIDATION_ERROR';
            if (Array.isArray(res.message)) {
                details = { messages: res.message };
            }
            this.logger.warn(`Validation error: ${message}`);
        }
        else if (exception instanceof Error) {
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
    translateMessage(message) {
        // Simple translation map for common validation errors
        const translations = {
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
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map