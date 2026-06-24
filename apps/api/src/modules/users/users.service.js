"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const user_domain_events_1 = require("./domain/user-domain-events");
/**
 * UsersService — Aggregate Root для User.
 * Все изменения пользователя проходят только через этот сервис.
 */
let UsersService = UsersService_1 = class UsersService {
    prisma;
    logger = new common_1.Logger(UsersService_1.name);
    eventBus;
    constructor(prisma) {
        this.prisma = prisma;
        this.eventBus = user_domain_events_1.DomainEventBus.getInstance();
    }
    // ============================================================
    // PUBLIC PROFILE — GET /users/:id
    // ============================================================
    async getPublicProfile(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: {
                _count: {
                    select: {
                        games: true,
                        scenarios: true,
                        captainTeams: true,
                        reviews: true,
                        followers: true,
                        following: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        const u = user;
        const profile = u.profile || {};
        const rep = u.reputationData || {};
        return {
            uuid: u.id,
            username: u.username,
            slug: u.slug,
            avatar: profile.avatar || u.avatarUrl || null,
            bio: profile.bio || u.bio || '',
            city: profile.city || u.city || '',
            rating: rep.rating || u.rating || 0,
            trustScore: rep.trustScore || 0,
            achievements: rep.achievements || u.achievements || [],
            gamesPlayed: user._count.captainTeams,
            gamesCreated: u.gamesCreated,
            gamesConducted: u.gamesConducted,
            scenariosCreated: u.scenariosCreated,
            reviewsCount: user._count.reviews,
            followersCount: user._count.followers,
            followingCount: user._count.following,
            lastSeenAt: u.lastSeenAt,
            createdAt: u.createdAt,
        };
    }
    // ============================================================
    // PRIVATE PROFILE — GET /users/me
    // ============================================================
    async getMyProfile(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: {
                _count: {
                    select: {
                        games: true,
                        scenarios: true,
                        captainTeams: true,
                        reviews: true,
                        followers: true,
                        following: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        const u = user;
        const profile = u.profile || {};
        const settings = u.settings || {};
        const security = u.security || {};
        const rep = u.reputationData || {};
        const aiProfile = u.aiProfile || {};
        const featureFlags = u.featureFlags || {};
        return {
            uuid: u.id,
            username: u.username,
            slug: u.slug,
            email: u.email,
            avatar: profile.avatar || u.avatarUrl || null,
            bio: profile.bio || u.bio || '',
            city: profile.city || u.city || '',
            roles: u.roles,
            status: u.status,
            verified: u.verified,
            version: u.version,
            rating: rep.rating || u.rating || 0,
            trustScore: rep.trustScore || 0,
            achievements: rep.achievements || u.achievements || [],
            gamesPlayed: user._count.captainTeams,
            gamesCreated: u.gamesCreated,
            gamesConducted: u.gamesConducted,
            scenariosCreated: u.scenariosCreated,
            reviewsCount: user._count.reviews,
            followersCount: user._count.followers,
            followingCount: user._count.following,
            language: settings.language || 'ru',
            timezone: settings.timezone || 'Europe/Moscow',
            theme: settings.theme || 'dark',
            notificationSettings: settings.notifications || {},
            privacySettings: settings.privacy || {},
            socialLinks: profile.socialLinks || {},
            favorites: profile.favorites || { games: [], scenarios: [], authors: [] },
            lastLoginAt: security.lastLoginAt || u.lastLoginAt || null,
            failedLoginAttempts: security.failedLoginAttempts || 0,
            passwordChangedAt: security.passwordChangedAt || null,
            trustedDevices: security.trustedDevices || [],
            featureFlags,
            metadata: profile.metadata || {},
            aiProfile,
            lastSeenAt: u.lastSeenAt,
            createdAt: u.createdAt,
        };
    }
    // ============================================================
    // ADMIN PROFILE — GET /users/:id/admin
    // ============================================================
    async getAdminProfile(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        games: true,
                        scenarios: true,
                        captainTeams: true,
                        reviews: true,
                        followers: true,
                        following: true,
                    },
                },
                auditLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        const u = user;
        const profile = u.profile || {};
        const settings = u.settings || {};
        const security = u.security || {};
        const rep = u.reputationData || {};
        const capabilities = u.capabilities || [];
        return {
            uuid: u.id,
            username: u.username,
            slug: u.slug,
            email: u.email,
            avatar: profile.avatar || u.avatarUrl || null,
            bio: profile.bio || u.bio || '',
            city: profile.city || u.city || '',
            roles: u.roles,
            status: u.status,
            verified: u.verified,
            version: u.version,
            rating: rep.rating || u.rating || 0,
            trustScore: rep.trustScore || 0,
            achievements: rep.achievements || u.achievements || [],
            gamesPlayed: user._count.captainTeams,
            gamesCreated: u.gamesCreated,
            gamesConducted: u.gamesConducted,
            scenariosCreated: u.scenariosCreated,
            reviewsCount: user._count.reviews,
            followersCount: user._count.followers,
            followingCount: user._count.following,
            language: settings.language || 'ru',
            timezone: settings.timezone || 'Europe/Moscow',
            theme: settings.theme || 'dark',
            notificationSettings: settings.notifications || {},
            privacySettings: settings.privacy || {},
            socialLinks: profile.socialLinks || {},
            favorites: profile.favorites || { games: [], scenarios: [], authors: [] },
            lastLoginAt: security.lastLoginAt || u.lastLoginAt || null,
            failedLoginAttempts: security.failedLoginAttempts || 0,
            passwordChangedAt: security.passwordChangedAt || null,
            trustedDevices: security.trustedDevices || [],
            capabilities,
            violations: rep.violations || 0,
            featureFlags: u.featureFlags || {},
            metadata: profile.metadata || {},
            deletedAt: u.deletedAt,
            lastSeenAt: u.lastSeenAt,
            createdAt: u.createdAt,
            auditLog: user.auditLogs,
        };
    }
    // ============================================================
    // UPDATE PROFILE — PATCH /users/me
    // ============================================================
    async updateProfile(userId, dto, ip, userAgent) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        const u = user;
        // Проверка уникальности username
        if (dto.username && dto.username !== u.username) {
            const existing = await this.prisma.user.findFirst({
                where: { username: dto.username },
            });
            if (existing) {
                throw new common_1.ConflictException('Это имя пользователя уже занято');
            }
        }
        const oldProfile = { ...(u.profile || {}) };
        const oldSettings = { ...(u.settings || {}) };
        const profile = { ...oldProfile };
        const settings = { ...oldSettings };
        if (dto.bio !== undefined)
            profile.bio = dto.bio;
        if (dto.city !== undefined)
            profile.city = dto.city;
        if (dto.socialLinks !== undefined) {
            profile.socialLinks = { ...(profile.socialLinks || {}), ...dto.socialLinks };
        }
        if (dto.metadata !== undefined) {
            profile.metadata = { ...(profile.metadata || {}), ...dto.metadata };
        }
        if (dto.language !== undefined)
            settings.language = dto.language;
        if (dto.timezone !== undefined)
            settings.timezone = dto.timezone;
        if (dto.theme !== undefined)
            settings.theme = dto.theme;
        if (dto.notificationSettings !== undefined) {
            settings.notifications = { ...(settings.notifications || {}), ...dto.notificationSettings };
        }
        if (dto.privacySettings !== undefined) {
            settings.privacy = { ...(settings.privacy || {}), ...dto.privacySettings };
        }
        const updateData = { profile, settings, version: { increment: 1 } };
        if (dto.username && dto.username !== u.username) {
            updateData.username = dto.username;
            updateData.slug = this.slugify(dto.username);
            updateData.name = dto.username;
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
        await this.createAuditLog(userId, 'profile.updated', 'User', userId, {
            old: { profile: oldProfile, settings: oldSettings },
            new: { profile, settings },
        }, ip, userAgent);
        await this.eventBus.publish({
            type: user_domain_events_1.UserDomainEventType.ProfileUpdated,
            userId,
            payload: { changes: Object.keys(dto) },
            timestamp: new Date(),
            version: 2,
        });
        if (dto.privacySettings) {
            await this.eventBus.publish({
                type: user_domain_events_1.UserDomainEventType.ProfilePrivacyChanged,
                userId,
                payload: { privacy: dto.privacySettings },
                timestamp: new Date(),
                version: 2,
            });
        }
        this.logger.log(`Profile updated for user ${userId}`);
        return this.getMyProfile(userId);
    }
    // ============================================================
    // UPDATE AVATAR — POST /users/me/avatar
    // ============================================================
    async updateAvatar(userId, avatarUrl, ip, userAgent) {
        if (!avatarUrl || !avatarUrl.startsWith('http')) {
            throw new common_1.BadRequestException('Некорректный URL аватара');
        }
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        const u = user;
        const profile = { ...(u.profile || {}), avatar: avatarUrl };
        await this.prisma.user.update({
            where: { id: userId },
            data: { profile, avatarUrl, version: { increment: 1 } },
        });
        await this.createAuditLog(userId, 'avatar.changed', 'User', userId, {
            old: { avatar: u.profile?.avatar || u.avatarUrl },
            new: { avatar: avatarUrl },
        }, ip, userAgent);
        await this.eventBus.publish({
            type: user_domain_events_1.UserDomainEventType.AvatarChanged,
            userId,
            payload: { avatarUrl },
            timestamp: new Date(),
            version: 2,
        });
        this.logger.log(`Avatar updated for user ${userId}`);
        return { avatarUrl };
    }
    // ============================================================
    // DELETE AVATAR — DELETE /users/me/avatar
    // ============================================================
    async deleteAvatar(userId, ip, userAgent) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        const u = user;
        const profile = { ...(u.profile || {}), avatar: null };
        await this.prisma.user.update({
            where: { id: userId },
            data: { profile, avatarUrl: null, version: { increment: 1 } },
        });
        await this.createAuditLog(userId, 'avatar.deleted', 'User', userId, {}, ip, userAgent);
        await this.eventBus.publish({
            type: user_domain_events_1.UserDomainEventType.AvatarDeleted,
            userId,
            payload: {},
            timestamp: new Date(),
            version: 2,
        });
        return { avatarUrl: null };
    }
    // ============================================================
    // SOFT DELETE — DELETE /users/me
    // ============================================================
    async deleteUser(userId, ip, userAgent) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { deletedAt: new Date(), status: 'INACTIVE' },
        });
        await this.createAuditLog(userId, 'user.deleted', 'User', userId, {}, ip, userAgent);
        await this.eventBus.publish({
            type: user_domain_events_1.UserDomainEventType.UserDeleted,
            userId,
            payload: {},
            timestamp: new Date(),
            version: 2,
        });
        this.logger.log(`User ${userId} soft-deleted`);
        return { message: 'Аккаунт удалён' };
    }
    // ============================================================
    // FOLLOW SYSTEM
    // ============================================================
    async followUser(followerId, followingId) {
        if (followerId === followingId) {
            throw new common_1.BadRequestException('Нельзя подписаться на самого себя');
        }
        const following = await this.prisma.user.findFirst({
            where: { id: followingId, deletedAt: null },
        });
        if (!following) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        const existing = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: { followerId, followingId },
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Вы уже подписаны на этого пользователя');
        }
        await this.prisma.follow.create({
            data: { followerId, followingId },
        });
        await this.eventBus.publish({
            type: user_domain_events_1.UserDomainEventType.FollowCreated,
            userId: followerId,
            payload: { followingId },
            timestamp: new Date(),
            version: 2,
        });
        return { message: 'Подписка оформлена' };
    }
    async unfollowUser(followerId, followingId) {
        const existing = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: { followerId, followingId },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Вы не подписаны на этого пользователя');
        }
        await this.prisma.follow.delete({
            where: { id: existing.id },
        });
        await this.eventBus.publish({
            type: user_domain_events_1.UserDomainEventType.FollowDeleted,
            userId: followerId,
            payload: { followingId },
            timestamp: new Date(),
            version: 2,
        });
        return { message: 'Подписка отменена' };
    }
    async getFollowers(userId, limit = 20, offset = 0) {
        const [items, total] = await Promise.all([
            this.prisma.follow.findMany({
                where: { followingId: userId },
                include: {
                    follower: {
                        select: { id: true, username: true, slug: true, avatarUrl: true, bio: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.follow.count({ where: { followingId: userId } }),
        ]);
        return {
            items: items.map((f) => ({
                userId: f.follower.id,
                username: f.follower.username,
                slug: f.follower.slug,
                avatar: f.follower.avatarUrl,
                bio: f.follower.bio || '',
                followedAt: f.createdAt,
            })),
            total,
        };
    }
    async getFollowing(userId, limit = 20, offset = 0) {
        const [items, total] = await Promise.all([
            this.prisma.follow.findMany({
                where: { followerId: userId },
                include: {
                    following: {
                        select: { id: true, username: true, slug: true, avatarUrl: true, bio: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.follow.count({ where: { followerId: userId } }),
        ]);
        return {
            items: items.map((f) => ({
                userId: f.following.id,
                username: f.following.username,
                slug: f.following.slug,
                avatar: f.following.avatarUrl,
                bio: f.following.bio || '',
                followedAt: f.createdAt,
            })),
            total,
        };
    }
    // ============================================================
    // FAVORITES
    // ============================================================
    async getFavorites(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            select: { profile: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        const profile = user.profile || {};
        return profile.favorites || { games: [], scenarios: [], authors: [] };
    }
    async addFavorite(userId, category, itemId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        const u = user;
        const profile = { ...(u.profile || {}) };
        const favorites = { ...(profile.favorites || { games: [], scenarios: [], authors: [] }) };
        if (!favorites[category])
            favorites[category] = [];
        if (favorites[category].includes(itemId)) {
            throw new common_1.ConflictException('Уже в избранном');
        }
        favorites[category].push(itemId);
        profile.favorites = favorites;
        await this.prisma.user.update({
            where: { id: userId },
            data: { profile, version: { increment: 1 } },
        });
        await this.eventBus.publish({
            type: user_domain_events_1.UserDomainEventType.FavoritesUpdated,
            userId,
            payload: { category, itemId, action: 'add' },
            timestamp: new Date(),
            version: 2,
        });
        return favorites;
    }
    async removeFavorite(userId, category, itemId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        const u = user;
        const profile = { ...(u.profile || {}) };
        const favorites = { ...(profile.favorites || { games: [], scenarios: [], authors: [] }) };
        if (!favorites[category])
            return favorites;
        favorites[category] = favorites[category].filter((id) => id !== itemId);
        profile.favorites = favorites;
        await this.prisma.user.update({
            where: { id: userId },
            data: { profile, version: { increment: 1 } },
        });
        await this.eventBus.publish({
            type: user_domain_events_1.UserDomainEventType.FavoritesUpdated,
            userId,
            payload: { category, itemId, action: 'remove' },
            timestamp: new Date(),
            version: 2,
        });
        return favorites;
    }
    // ============================================================
    // ACTIVITY FEED
    // ============================================================
    async getActivityFeed(userId, limit = 20, offset = 0) {
        const [items, total] = await Promise.all([
            this.prisma.activityLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.activityLog.count({ where: { userId } }),
        ]);
        return { items, total };
    }
    async addActivity(userId, type, payload = {}) {
        await this.prisma.activityLog.create({
            data: { userId, type, payload },
        });
    }
    // ============================================================
    // USER'S TEAMS
    // ============================================================
    async getUserTeams(userId) {
        return this.prisma.team.findMany({
            where: {
                OR: [
                    { captainId: userId },
                    { members: { some: { userId, status: 'ACTIVE' } } },
                ],
            },
            include: {
                _count: { select: { members: true, games: true } },
                captain: {
                    select: { id: true, username: true, slug: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    // ============================================================
    // USER'S SCENARIOS
    // ============================================================
    async getUserScenarios(userId, limit = 20, offset = 0) {
        const [items, total] = await Promise.all([
            this.prisma.scenario.findMany({
                where: { authorId: userId, deletedAt: null },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
                include: { _count: { select: { games: true, purchases: true } } },
            }),
            this.prisma.scenario.count({ where: { authorId: userId, deletedAt: null } }),
        ]);
        return { items, total };
    }
    // ============================================================
    // USER'S ACHIEVEMENTS
    // ============================================================
    async getUserAchievements(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            select: { reputationData: true, achievements: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        const rep = user.reputationData || {};
        return rep.achievements || user.achievements || [];
    }
    async addAchievement(userId, achievement) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId },
            select: { reputationData: true, achievements: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        const u = user;
        const rep = { ...(u.reputationData || {}) };
        const achievements = rep.achievements || u.achievements || [];
        if (achievements.some((a) => a.type === achievement.type)) {
            return achievements;
        }
        const updated = [...achievements, achievement];
        rep.achievements = updated;
        await this.prisma.user.update({
            where: { id: userId },
            data: { reputationData: rep, achievements: updated },
        });
        await this.eventBus.publish({
            type: user_domain_events_1.UserDomainEventType.AchievementUnlocked,
            userId,
            payload: { achievement: achievement.type },
            timestamp: new Date(),
            version: 2,
        });
        await this.addActivity(userId, 'achievement', {
            type: achievement.type,
            name: achievement.name,
        });
        this.logger.log(`Achievement ${achievement.type} unlocked for user ${userId}`);
        return updated;
    }
    async checkAndAwardAchievements(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId },
            select: {
                roles: true,
                gamesCreated: true,
                gamesConducted: true,
                scenariosCreated: true,
                reputationData: true,
                achievements: true,
                _count: { select: { captainTeams: true } },
            },
        });
        if (!user)
            return [];
        const u = user;
        const rep = { ...(u.reputationData || {}) };
        const achievements = rep.achievements || u.achievements || [];
        const newAchievements = [];
        const roles = u.roles || [];
        if (user.scenariosCreated >= 1 && !achievements.some((a) => a.type === 'FIRST_SCENARIO')) {
            newAchievements.push({ id: `ach_first_scenario_${userId}`, type: 'FIRST_SCENARIO', name: 'Первый сценарий', description: 'Опубликуйте свой первый сценарий', icon: '📝', unlockedAt: new Date().toISOString() });
        }
        if (roles.includes('ORGANIZER') && !achievements.some((a) => a.type === 'ORGANIZER')) {
            newAchievements.push({ id: `ach_organizer_${userId}`, type: 'ORGANIZER', name: 'Организатор', description: 'Получите роль организатора', icon: '🎯', unlockedAt: new Date().toISOString() });
        }
        if (user._count.captainTeams >= 1 && !achievements.some((a) => a.type === 'FIRST_GAME')) {
            newAchievements.push({ id: `ach_first_game_${userId}`, type: 'FIRST_GAME', name: 'Первая игра', description: 'Пройдите свою первую игру', icon: '🎮', unlockedAt: new Date().toISOString() });
        }
        if (user._count.captainTeams >= 10 && !achievements.some((a) => a.type === 'TEN_GAMES')) {
            newAchievements.push({ id: `ach_10games_${userId}`, type: 'TEN_GAMES', name: '10 игр', description: 'Пройдите 10 игр', icon: '🔟', unlockedAt: new Date().toISOString() });
        }
        if (user._count.captainTeams >= 50 && !achievements.some((a) => a.type === 'FIFTY_GAMES')) {
            newAchievements.push({ id: `ach_50games_${userId}`, type: 'FIFTY_GAMES', name: '50 игр', description: 'Пройдите 50 игр', icon: '🎖️', unlockedAt: new Date().toISOString() });
        }
        if (user._count.captainTeams >= 100 && !achievements.some((a) => a.type === 'HUNDRED_GAMES')) {
            newAchievements.push({ id: `ach_100games_${userId}`, type: 'HUNDRED_GAMES', name: '100 игр', description: 'Пройдите 100 игр', icon: '🏆', unlockedAt: new Date().toISOString() });
        }
        for (const achievement of newAchievements) {
            await this.addAchievement(userId, achievement);
        }
        return newAchievements;
    }
    // ============================================================
    // USER'S REVIEWS
    // ============================================================
    async getUserReviews(userId, limit = 20, offset = 0) {
        const [items, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
                include: {
                    game: { select: { id: true, title: true, imageUrl: true } },
                },
            }),
            this.prisma.review.count({ where: { userId } }),
        ]);
        return { items, total };
    }
    // ============================================================
    // TRUST SCORE (автоматическое вычисление)
    // ============================================================
    async recalculateTrustScore(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId },
            select: {
                reputationData: true,
                _count: { select: { reviews: true, captainTeams: true, followers: true } },
            },
        });
        if (!user)
            return 0;
        const u = user;
        const rep = { ...(u.reputationData || {}) };
        let score = 50;
        score += Math.min(u._count.captainTeams * 2, 20);
        score += Math.min(u._count.reviews * 3, 15);
        score += Math.min(u._count.followers, 10);
        score -= (rep.violations || 0) * 10;
        score = Math.max(0, Math.min(100, score));
        rep.trustScore = score;
        await this.prisma.user.update({
            where: { id: userId },
            data: { reputationData: rep },
        });
        return score;
    }
    // ============================================================
    // CAPABILITIES (автоматическое вычисление)
    // ============================================================
    async recalculateCapabilities(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId },
            select: { roles: true, gamesCreated: true, gamesConducted: true, scenariosCreated: true },
        });
        if (!user)
            return [];
        const u = user;
        const roles = u.roles || [];
        const capabilities = [];
        capabilities.push('CREATE_TEAM');
        if (user.scenariosCreated >= 1 || roles.includes('ORGANIZER'))
            capabilities.push('CREATE_SCENARIOS');
        if (roles.includes('ORGANIZER'))
            capabilities.push('HOST_EVENTS');
        if (roles.includes('ORGANIZER') && user.scenariosCreated >= 1)
            capabilities.push('SELL_SCENARIOS');
        if (roles.includes('ADMIN') || roles.includes('MODERATOR'))
            capabilities.push('MODERATE_CONTENT');
        if (user.gamesConducted >= 1)
            capabilities.push('STREAM_GAME');
        await this.prisma.user.update({
            where: { id: userId },
            data: { capabilities },
        });
        return capabilities;
    }
    // ============================================================
    // UPDATE LAST SEEN
    // ============================================================
    async updateLastSeen(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { lastSeenAt: new Date() },
        });
    }
    // ============================================================
    // CALCULATE RATING
    // ============================================================
    async calculateUserRating(userId) {
        const reviews = await this.prisma.review.findMany({
            where: { userId },
            select: { rating: true },
        });
        if (reviews.length === 0)
            return 0;
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        const rounded = Math.round(avg * 100) / 100;
        const user = await this.prisma.user.findFirst({
            where: { id: userId },
            select: { reputationData: true },
        });
        const rep = { ...(user?.reputationData || {}) };
        rep.rating = rounded;
        await this.prisma.user.update({
            where: { id: userId },
            data: { reputationData: rep, rating: rounded },
        });
        return rounded;
    }
    // ============================================================
    // HELPERS
    // ============================================================
    async createAuditLog(userId, action, entity, entityId, changes, ip, userAgent) {
        try {
            await this.prisma.auditLog.create({
                data: { userId, action, entity, entityId, oldValue: changes.old, newValue: changes.new, ip: ip || null, userAgent: userAgent || null },
            });
        }
        catch (error) {
            this.logger.warn(`Audit log failed: ${error.message}`);
        }
    }
    slugify(text) {
        return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 150);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map