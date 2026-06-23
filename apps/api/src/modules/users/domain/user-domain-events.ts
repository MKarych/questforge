// ============================================================
// User Domain Events
// Каждое изменение пользователя публикует событие.
// События — единственный способ связи между модулями.
// ============================================================

export enum UserDomainEventType {
  UserCreated = 'user.created',
  UserUpdated = 'user.updated',
  AvatarChanged = 'user.avatar.changed',
  AvatarDeleted = 'user.avatar.deleted',
  UserBanned = 'user.banned',
  UserUnbanned = 'user.unbanned',
  UserDeleted = 'user.deleted',
  RoleAssigned = 'user.role.assigned',
  FollowCreated = 'follow.created',
  FollowDeleted = 'follow.deleted',
  AchievementUnlocked = 'achievement.unlocked',
  EmailVerified = 'email.verified',
  ProfilePrivacyChanged = 'privacy.changed',
  ProfileUpdated = 'profile.updated',
  SettingsUpdated = 'settings.updated',
  FavoritesUpdated = 'favorites.updated',
  UsernameChanged = 'username.changed',
}

export interface UserDomainEvent {
  type: UserDomainEventType;
  userId: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  version: number;
}

export type DomainEventHandler = (event: UserDomainEvent) => void | Promise<void>;

/**
 * Простая шина доменных событий (in-process).
 * В будущем может быть заменена на RabbitMQ / Kafka / EventBridge.
 */
export class DomainEventBus {
  private handlers: Map<UserDomainEventType, DomainEventHandler[]> = new Map();
  private static instance: DomainEventBus;

  static getInstance(): DomainEventBus {
    if (!DomainEventBus.instance) {
      DomainEventBus.instance = new DomainEventBus();
    }
    return DomainEventBus.instance;
  }

  subscribe(eventType: UserDomainEventType, handler: DomainEventHandler): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  async publish(event: UserDomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    const promises = handlers.map((handler) => handler(event));
    await Promise.all(promises);
  }

  /** Создать событие с правильной структурой */
  static create(
    type: UserDomainEventType,
    userId: string,
    payload: Record<string, unknown> = {},
  ): UserDomainEvent {
    return {
      type,
      userId,
      payload,
      timestamp: new Date(),
      version: 2,
    };
  }
}