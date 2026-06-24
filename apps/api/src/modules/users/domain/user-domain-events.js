"use strict";
// ============================================================
// User Domain Events
// Каждое изменение пользователя публикует событие.
// События — единственный способ связи между модулями.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEventBus = exports.UserDomainEventType = void 0;
var UserDomainEventType;
(function (UserDomainEventType) {
    UserDomainEventType["UserCreated"] = "user.created";
    UserDomainEventType["UserUpdated"] = "user.updated";
    UserDomainEventType["AvatarChanged"] = "user.avatar.changed";
    UserDomainEventType["AvatarDeleted"] = "user.avatar.deleted";
    UserDomainEventType["UserBanned"] = "user.banned";
    UserDomainEventType["UserUnbanned"] = "user.unbanned";
    UserDomainEventType["UserDeleted"] = "user.deleted";
    UserDomainEventType["RoleAssigned"] = "user.role.assigned";
    UserDomainEventType["FollowCreated"] = "follow.created";
    UserDomainEventType["FollowDeleted"] = "follow.deleted";
    UserDomainEventType["AchievementUnlocked"] = "achievement.unlocked";
    UserDomainEventType["EmailVerified"] = "email.verified";
    UserDomainEventType["ProfilePrivacyChanged"] = "privacy.changed";
    UserDomainEventType["ProfileUpdated"] = "profile.updated";
    UserDomainEventType["SettingsUpdated"] = "settings.updated";
    UserDomainEventType["FavoritesUpdated"] = "favorites.updated";
    UserDomainEventType["UsernameChanged"] = "username.changed";
})(UserDomainEventType || (exports.UserDomainEventType = UserDomainEventType = {}));
/**
 * Простая шина доменных событий (in-process).
 * В будущем может быть заменена на RabbitMQ / Kafka / EventBridge.
 */
class DomainEventBus {
    handlers = new Map();
    static instance;
    static getInstance() {
        if (!DomainEventBus.instance) {
            DomainEventBus.instance = new DomainEventBus();
        }
        return DomainEventBus.instance;
    }
    subscribe(eventType, handler) {
        const existing = this.handlers.get(eventType) || [];
        existing.push(handler);
        this.handlers.set(eventType, existing);
    }
    async publish(event) {
        const handlers = this.handlers.get(event.type) || [];
        const promises = handlers.map((handler) => handler(event));
        await Promise.all(promises);
    }
    /** Создать событие с правильной структурой */
    static create(type, userId, payload = {}) {
        return {
            type,
            userId,
            payload,
            timestamp: new Date(),
            version: 2,
        };
    }
}
exports.DomainEventBus = DomainEventBus;
//# sourceMappingURL=user-domain-events.js.map