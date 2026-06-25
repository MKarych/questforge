import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * OptionalAuthGuard — пропускает запросы без токена,
 * но если токен есть — проверяет его и добавляет user в request.
 */
@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: TUser): TUser {
    // Не выбрасываем ошибку, если пользователь не аутентифицирован
    return user;
  }

  canActivate(context: ExecutionContext) {
    // Вызываем родительский canActivate, но игнорируем ошибки
    return super.canActivate(context);
  }
}