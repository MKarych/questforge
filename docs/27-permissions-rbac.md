```markdown
# Permissions RBAC: Права доступа

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Архитектурный
> **Статус:** Утвержден

---

## 1. Принципы

- Четкое разделение ролей
- Права назначаются через роли
- Каждый endpoint защищен

---

## 2. Роли

| Роль | Описание |
| :--- | :--- |
| **SUPER_ADMIN** | Полный доступ ко всему |
| **ADMIN** | Управление пользователями, модерация, платежи |
| **MODERATOR** | Модерация игр и сценариев |
| **ORGANIZER** | Создание и проведение игр |
| **AUTHOR** | Создание сценариев, продажа на маркетплейсе |
| **PLAYER** | Участие в играх |

---

## 3. Матрица прав

| Действие | SUPER_ADMIN | ADMIN | MODERATOR | ORGANIZER | AUTHOR | PLAYER |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Пользователи** | | | | | | |
| Просмотр всех пользователей | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Блокировка пользователя | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Смена роли | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Игры** | | | | | | |
| Создание игры | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Публикация игры | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Модерация игры | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Запуск игры | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Time Travel | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Удаление игры | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Сценарии** | | | | | | |
| Создание сценария | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Публикация сценария | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Модерация сценария | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Маркетплейс** | | | | | | |
| Покупка сценария | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Продажа сценария | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Игроки** | | | | | | |
| Участие в игре | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Просмотр статистики | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Администрирование** | | | | | | |
| Просмотр статистики платформы | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Настройка системы | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Реализация в коде

```typescript
enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  ORGANIZER = 'ORGANIZER',
  AUTHOR = 'AUTHOR',
  PLAYER = 'PLAYER'
}

enum Permission {
  // Users
  VIEW_USERS = 'VIEW_USERS',
  BLOCK_USER = 'BLOCK_USER',
  CHANGE_ROLE = 'CHANGE_ROLE',
  
  // Games
  CREATE_GAME = 'CREATE_GAME',
  PUBLISH_GAME = 'PUBLISH_GAME',
  MODERATE_GAME = 'MODERATE_GAME',
  START_GAME = 'START_GAME',
  TIME_TRAVEL = 'TIME_TRAVEL',
  DELETE_GAME = 'DELETE_GAME',
  
  // Scenarios
  CREATE_SCENARIO = 'CREATE_SCENARIO',
  PUBLISH_SCENARIO = 'PUBLISH_SCENARIO',
  MODERATE_SCENARIO = 'MODERATE_SCENARIO',
  
  // Marketplace
  PURCHASE_SCENARIO = 'PURCHASE_SCENARIO',
  SELL_SCENARIO = 'SELL_SCENARIO',
  
  // Players
  PLAY_GAME = 'PLAY_GAME',
  VIEW_STATISTICS = 'VIEW_STATISTICS',
  
  // Admin
  VIEW_PLATFORM_STATS = 'VIEW_PLATFORM_STATS',
  CONFIGURE_SYSTEM = 'CONFIGURE_SYSTEM'
}

class PermissionChecker {
  private permissions: Map<Role, Permission[]> = new Map();
  
  constructor() {
    this.permissions.set(Role.SUPER_ADMIN, Object.values(Permission));
    this.permissions.set(Role.ADMIN, [
      Permission.VIEW_USERS,
      Permission.BLOCK_USER,
      Permission.CHANGE_ROLE,
      Permission.MODERATE_GAME,
      Permission.MODERATE_SCENARIO,
      Permission.VIEW_PLATFORM_STATS,
      Permission.DELETE_GAME
    ]);
    this.permissions.set(Role.MODERATOR, [
      Permission.MODERATE_GAME,
      Permission.MODERATE_SCENARIO
    ]);
    this.permissions.set(Role.ORGANIZER, [
      Permission.CREATE_GAME,
      Permission.PUBLISH_GAME,
      Permission.START_GAME,
      Permission.TIME_TRAVEL,
      Permission.PURCHASE_SCENARIO,
      Permission.VIEW_STATISTICS
    ]);
    this.permissions.set(Role.AUTHOR, [
      Permission.CREATE_SCENARIO,
      Permission.PUBLISH_SCENARIO,
      Permission.SELL_SCENARIO,
      Permission.PURCHASE_SCENARIO,
      Permission.VIEW_STATISTICS
    ]);
    this.permissions.set(Role.PLAYER, [
      Permission.PLAY_GAME,
      Permission.VIEW_STATISTICS
    ]);
  }
  
  hasPermission(role: Role, permission: Permission): boolean {
    return this.permissions.get(role)?.includes(permission) || false;
  }
  
  check(user: User, permission: Permission): void {
    if (!this.hasPermission(user.role, permission)) {
      throw new ForbiddenError(`User does not have permission: ${permission}`);
    }
  }
}
```

---

## 5. Использование в API

```typescript
// Guard для проверки прав
@Injectable()
class PermissionsGuard implements CanActivate {
  constructor(
    private permissionChecker: PermissionChecker,
    private reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<Permission[]>(
      'permissions',
      context.getHandler()
    );

    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    for (const permission of requiredPermissions) {
      if (!this.permissionChecker.hasPermission(user.role, permission)) {
        throw new ForbiddenError(`Missing permission: ${permission}`);
      }
    }

    return true;
  }
}

// Использование в контроллере
@Controller('games')
export class GamesController {
  @Post(':id/time-travel')
  @UseGuards(PermissionsGuard)
  @SetMetadata('permissions', [Permission.TIME_TRAVEL])
  async timeTravel(@Param('id') id: string) {
    // Только ORGANIZER с правом TIME_TRAVEL могут вызвать
  }
}
```

---

## 6. Итоговый принцип

> **Каждый endpoint защищен.**
>
> **Права назначаются через роли.**
>
> **Роли четко разделены.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Безопасность через роли.*
```