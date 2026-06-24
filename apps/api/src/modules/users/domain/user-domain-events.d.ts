export declare enum UserDomainEventType {
    UserCreated = "user.created",
    UserUpdated = "user.updated",
    AvatarChanged = "user.avatar.changed",
    AvatarDeleted = "user.avatar.deleted",
    UserBanned = "user.banned",
    UserUnbanned = "user.unbanned",
    UserDeleted = "user.deleted",
    RoleAssigned = "user.role.assigned",
    FollowCreated = "follow.created",
    FollowDeleted = "follow.deleted",
    AchievementUnlocked = "achievement.unlocked",
    EmailVerified = "email.verified",
    ProfilePrivacyChanged = "privacy.changed",
    ProfileUpdated = "profile.updated",
    SettingsUpdated = "settings.updated",
    FavoritesUpdated = "favorites.updated",
    UsernameChanged = "username.changed"
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
export declare class DomainEventBus {
    private handlers;
    private static instance;
    static getInstance(): DomainEventBus;
    subscribe(eventType: UserDomainEventType, handler: DomainEventHandler): void;
    publish(event: UserDomainEvent): Promise<void>;
    /** Создать событие с правильной структурой */
    static create(type: UserDomainEventType, userId: string, payload?: Record<string, unknown>): UserDomainEvent;
}
//# sourceMappingURL=user-domain-events.d.ts.map