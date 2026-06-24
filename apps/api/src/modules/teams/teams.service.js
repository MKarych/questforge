"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const team_types_1 = require("./types/team-types");
const uuid_1 = require("uuid");
const crypto = __importStar(require("crypto"));
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(value) {
    return UUID_REGEX.test(value);
}
function slugify(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9а-яё]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 150);
}
let TeamsService = class TeamsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ================================================================
    // CREATE
    // ================================================================
    async create(userId, dto) {
        const existingCaptainTeam = await this.prisma.team.findFirst({
            where: { captainId: userId, deletedAt: null, status: { not: team_types_1.TeamStatus.DELETED } },
        });
        if (existingCaptainTeam) {
            throw new common_1.BadRequestException('Вы уже являетесь капитаном другой команды');
        }
        const existingName = await this.prisma.team.findFirst({
            where: { name: dto.name, deletedAt: null },
        });
        if (existingName) {
            throw new common_1.ConflictException('Команда с таким названием уже существует');
        }
        let slug = dto.slug || slugify(dto.name);
        const existingSlug = await this.prisma.team.findUnique({ where: { slug } });
        if (existingSlug) {
            slug = `${slug}-${(0, uuid_1.v4)().substring(0, 8)}`;
        }
        const team = await this.prisma.team.create({
            data: {
                name: dto.name,
                slug,
                description: dto.description || null,
                city: dto.city || null,
                country: dto.country || null,
                website: dto.website || null,
                socials: dto.socials || {},
                captainId: userId,
                status: team_types_1.TeamStatus.ACTIVE,
                privacy: dto.privacy || team_types_1.TeamVisibility.PUBLIC,
                joinPolicy: dto.joinPolicy || 'INVITE_ONLY',
                tags: dto.tags || [],
                members: {
                    create: {
                        userId,
                        role: team_types_1.TeamRole.CAPTAIN,
                        status: team_types_1.MemberStatus.ACTIVE,
                    },
                },
            },
            include: {
                captain: { select: { id: true, name: true, avatarUrl: true } },
                members: {
                    where: { status: team_types_1.MemberStatus.ACTIVE },
                    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
                },
            },
        });
        await this.createAuditLog({
            teamId: team.id,
            actorId: userId,
            action: team_types_1.TeamDomainEvent.TeamCreated,
            entity: 'team',
            entityId: team.id,
            newValue: { name: team.name, slug: team.slug },
        });
        return {
            id: team.id,
            name: team.name,
            slug: team.slug,
            description: team.description,
            captain: team.captain,
            members: team.members.map((m) => ({
                id: m.user.id,
                name: m.user.name,
                avatarUrl: m.user.avatarUrl,
                role: m.role,
                joinedAt: m.joinedAt,
            })),
            membersCount: team.members.length,
            createdAt: team.createdAt,
        };
    }
    // ================================================================
    // FIND ALL
    // ================================================================
    async findAll(query) {
        const { city, status, search, tags, limit = 20, offset = 0 } = query;
        const where = {
            deletedAt: null,
            status: { not: team_types_1.TeamStatus.DELETED },
        };
        if (city)
            where.city = city;
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (tags && tags.length > 0) {
            where.tags = { hasSome: tags };
        }
        const [items, total] = await Promise.all([
            this.prisma.team.findMany({
                where,
                take: limit,
                skip: offset,
                include: {
                    captain: { select: { id: true, name: true, avatarUrl: true } },
                    _count: { select: { members: { where: { status: team_types_1.MemberStatus.ACTIVE } } } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.team.count({ where }),
        ]);
        return {
            items: items.map((team) => ({
                id: team.id,
                name: team.name,
                slug: team.slug,
                avatar: team.avatar,
                description: team.description,
                city: team.city,
                captain: team.captain,
                membersCount: team._count.members,
                status: team.status,
                tags: team.tags,
                createdAt: team.createdAt,
            })),
            total,
        };
    }
    // ================================================================
    // FIND ONE (public)
    // ================================================================
    async findOne(id) {
        if (!isValidUuid(id)) {
            throw new common_1.NotFoundException('Команда не найдена');
        }
        const team = await this.prisma.team.findFirst({
            where: { id, deletedAt: null, status: { not: team_types_1.TeamStatus.DELETED } },
            include: {
                captain: { select: { id: true, name: true, avatarUrl: true } },
                members: {
                    where: { status: team_types_1.MemberStatus.ACTIVE },
                    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
                    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
                },
                _count: { select: { members: { where: { status: team_types_1.MemberStatus.ACTIVE } } } },
            },
        });
        if (!team)
            throw new common_1.NotFoundException('Команда не найдена');
        return {
            id: team.id,
            name: team.name,
            slug: team.slug,
            avatar: team.avatar,
            banner: team.banner,
            description: team.description,
            city: team.city,
            country: team.country,
            website: team.website,
            socials: team.socials,
            captain: team.captain,
            members: team.members.map((m) => ({
                id: m.user.id,
                name: m.user.name,
                avatarUrl: m.user.avatarUrl,
                role: m.role,
                joinedAt: m.joinedAt,
            })),
            membersCount: team._count.members,
            status: team.status,
            privacy: team.privacy,
            joinPolicy: team.joinPolicy,
            tags: team.tags,
            createdAt: team.createdAt,
        };
    }
    // ================================================================
    // FIND PRIVATE (for members)
    // ================================================================
    async findPrivate(id, userId) {
        const team = await this.prisma.team.findFirst({
            where: { id, deletedAt: null, status: { not: team_types_1.TeamStatus.DELETED } },
            include: {
                captain: { select: { id: true, name: true, avatarUrl: true } },
                members: {
                    where: { status: team_types_1.MemberStatus.ACTIVE },
                    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
                    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
                },
                invites: {
                    where: { status: 'PENDING' },
                    include: { invitedUser: { select: { id: true, name: true, avatarUrl: true } } },
                },
                joinRequests: {
                    where: { status: 'PENDING' },
                    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
                },
                _count: { select: { members: { where: { status: team_types_1.MemberStatus.ACTIVE } } } },
            },
        });
        if (!team)
            throw new common_1.NotFoundException('Команда не найдена');
        const isMember = team.members.some((m) => m.userId === userId);
        if (!isMember && team.captainId !== userId) {
            throw new common_1.ForbiddenException('Только участники команды могут просматривать приватные данные');
        }
        return {
            id: team.id,
            name: team.name,
            slug: team.slug,
            avatar: team.avatar,
            banner: team.banner,
            description: team.description,
            city: team.city,
            country: team.country,
            website: team.website,
            socials: team.socials,
            captain: team.captain,
            members: team.members.map((m) => ({
                id: m.user.id,
                name: m.user.name,
                avatarUrl: m.user.avatarUrl,
                role: m.role,
                joinedAt: m.joinedAt,
            })),
            membersCount: team._count.members,
            status: team.status,
            privacy: team.privacy,
            joinPolicy: team.joinPolicy,
            tags: team.tags,
            settings: {
                privacy: team.privacy,
                joinPolicy: team.joinPolicy,
                limits: {
                    maxMembers: team.maxMembers,
                    maxInvitesPerDay: team.maxInvitesPerDay,
                    maxPendingRequests: team.maxPendingRequests,
                    maxChatMessagesPerMinute: team.maxChatMessagesPerMinute,
                },
            },
            invites: team.invites.map((inv) => ({
                id: inv.id,
                invitedUser: inv.invitedUser,
                status: inv.status,
                createdAt: inv.createdAt,
                expiresAt: inv.expiresAt,
            })),
            joinRequests: team.joinRequests.map((jr) => ({
                id: jr.id,
                user: jr.user,
                message: jr.message,
                status: jr.status,
                createdAt: jr.createdAt,
            })),
            createdAt: team.createdAt,
        };
    }
    // ================================================================
    // UPDATE
    // ================================================================
    async update(actorId, teamId, dto) {
        const team = await this.getActiveTeam(teamId);
        this.ensureCaptain(team, actorId);
        const data = {};
        const oldValues = {};
        const newValues = {};
        if (dto.name !== undefined) {
            const existing = await this.prisma.team.findFirst({
                where: { name: dto.name, id: { not: teamId }, deletedAt: null },
            });
            if (existing)
                throw new common_1.ConflictException('Команда с таким названием уже существует');
            data.name = dto.name;
            oldValues.name = team.name;
            newValues.name = dto.name;
        }
        if (dto.description !== undefined) {
            data.description = dto.description;
            oldValues.description = team.description;
            newValues.description = dto.description;
        }
        if (dto.avatar !== undefined) {
            data.avatar = dto.avatar;
            oldValues.avatar = team.avatar;
            newValues.avatar = dto.avatar;
        }
        if (dto.banner !== undefined) {
            data.banner = dto.banner;
            oldValues.banner = team.banner;
            newValues.banner = dto.banner;
        }
        if (dto.city !== undefined) {
            data.city = dto.city;
            oldValues.city = team.city;
            newValues.city = dto.city;
        }
        if (dto.country !== undefined) {
            data.country = dto.country;
            oldValues.country = team.country;
            newValues.country = dto.country;
        }
        if (dto.website !== undefined) {
            data.website = dto.website;
            oldValues.website = team.website;
            newValues.website = dto.website;
        }
        if (dto.socials !== undefined) {
            data.socials = dto.socials;
            oldValues.socials = team.socials;
            newValues.socials = dto.socials;
        }
        if (dto.privacy !== undefined) {
            data.privacy = dto.privacy;
            oldValues.privacy = team.privacy;
            newValues.privacy = dto.privacy;
        }
        if (dto.joinPolicy !== undefined) {
            data.joinPolicy = dto.joinPolicy;
            oldValues.joinPolicy = team.joinPolicy;
            newValues.joinPolicy = dto.joinPolicy;
        }
        if (dto.tags !== undefined) {
            data.tags = dto.tags;
            oldValues.tags = team.tags;
            newValues.tags = dto.tags;
        }
        if (dto.maxMembers !== undefined) {
            data.maxMembers = dto.maxMembers;
            oldValues.maxMembers = team.maxMembers;
            newValues.maxMembers = dto.maxMembers;
        }
        data.version = { increment: 1 };
        const updated = await this.prisma.team.update({
            where: { id: teamId },
            data,
            include: {
                captain: { select: { id: true, name: true, avatarUrl: true } },
                members: {
                    where: { status: team_types_1.MemberStatus.ACTIVE },
                    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
                },
                _count: { select: { members: { where: { status: team_types_1.MemberStatus.ACTIVE } } } },
            },
        });
        await this.createAuditLog({
            teamId,
            actorId,
            action: team_types_1.TeamDomainEvent.TeamUpdated,
            entity: 'team',
            entityId: teamId,
            oldValue: oldValues,
            newValue: newValues,
        });
        if (dto.privacy && dto.privacy !== team.privacy) {
            await this.createAuditLog({
                teamId,
                actorId,
                action: team_types_1.TeamDomainEvent.VisibilityChanged,
                entity: 'team',
                entityId: teamId,
                oldValue: { privacy: team.privacy },
                newValue: { privacy: dto.privacy },
            });
        }
        return {
            id: updated.id,
            name: updated.name,
            slug: updated.slug,
            avatar: updated.avatar,
            banner: updated.banner,
            description: updated.description,
            city: updated.city,
            country: updated.country,
            website: updated.website,
            socials: updated.socials,
            captain: updated.captain,
            members: updated.members.map((m) => ({
                id: m.user.id,
                name: m.user.name,
                avatarUrl: m.user.avatarUrl,
                role: m.role,
                joinedAt: m.joinedAt,
            })),
            membersCount: updated._count.members,
            status: updated.status,
            privacy: updated.privacy,
            joinPolicy: updated.joinPolicy,
            tags: updated.tags,
            createdAt: updated.createdAt,
        };
    }
    // ================================================================
    // DELETE (Soft Delete)
    // ================================================================
    async delete(actorId, teamId) {
        const team = await this.getActiveTeam(teamId);
        this.ensureCaptain(team, actorId);
        const activeMembersCount = await this.prisma.teamMember.count({
            where: { teamId, status: team_types_1.MemberStatus.ACTIVE, userId: { not: actorId } },
        });
        if (activeMembersCount > 0) {
            throw new common_1.BadRequestException('Нельзя удалить команду с активными участниками. Сначала исключите всех участников.');
        }
        await this.prisma.team.update({
            where: { id: teamId },
            data: {
                deletedAt: new Date(),
                status: team_types_1.TeamStatus.DELETED,
                version: { increment: 1 },
            },
        });
        await this.createAuditLog({
            teamId,
            actorId,
            action: team_types_1.TeamDomainEvent.TeamDeleted,
            entity: 'team',
            entityId: teamId,
            oldValue: { status: team.status },
            newValue: { status: team_types_1.TeamStatus.DELETED },
        });
        return { message: 'Команда удалена' };
    }
    // ================================================================
    // ADD MEMBER
    // ================================================================
    async addMember(actorId, teamId, userId) {
        const team = await this.getActiveTeam(teamId);
        this.ensureCaptain(team, actorId);
        const existingMember = await this.prisma.teamMember.findFirst({
            where: { teamId, userId, status: team_types_1.MemberStatus.ACTIVE },
        });
        if (existingMember) {
            throw new common_1.ConflictException('Пользователь уже является участником команды');
        }
        const activeCount = await this.prisma.teamMember.count({
            where: { teamId, status: team_types_1.MemberStatus.ACTIVE },
        });
        if (activeCount >= team.maxMembers) {
            throw new common_1.BadRequestException('Достигнут лимит участников команды');
        }
        const member = await this.prisma.teamMember.create({
            data: {
                teamId,
                userId,
                role: team_types_1.TeamRole.MEMBER,
                status: team_types_1.MemberStatus.ACTIVE,
            },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        });
        await this.createAuditLog({
            teamId,
            actorId,
            action: team_types_1.TeamDomainEvent.MemberJoined,
            entity: 'team_member',
            entityId: member.id,
            newValue: { userId, role: team_types_1.TeamRole.MEMBER },
        });
        return {
            id: member.user.id,
            name: member.user.name,
            avatarUrl: member.user.avatarUrl,
            role: member.role,
            joinedAt: member.joinedAt,
        };
    }
    // ================================================================
    // REMOVE MEMBER
    // ================================================================
    async removeMember(actorId, teamId, targetUserId) {
        const team = await this.getActiveTeam(teamId);
        this.ensureCaptain(team, actorId);
        if (targetUserId === actorId) {
            throw new common_1.BadRequestException('Капитан не может исключить себя. Используйте передачу капитанства');
        }
        const targetMember = await this.prisma.teamMember.findFirst({
            where: { teamId, userId: targetUserId, status: team_types_1.MemberStatus.ACTIVE },
        });
        if (!targetMember)
            throw new common_1.NotFoundException('Участник не найден');
        if (targetMember.role === team_types_1.TeamRole.CAPTAIN) {
            throw new common_1.BadRequestException('Нельзя исключить капитана');
        }
        await this.prisma.teamMember.update({
            where: { id: targetMember.id },
            data: { status: team_types_1.MemberStatus.KICKED, leftAt: new Date() },
        });
        await this.createAuditLog({
            teamId,
            actorId,
            action: team_types_1.TeamDomainEvent.MemberKicked,
            entity: 'team_member',
            entityId: targetMember.id,
            oldValue: { userId: targetUserId, role: targetMember.role },
            newValue: { status: team_types_1.MemberStatus.KICKED },
        });
        return { message: 'Участник исключён из команды' };
    }
    // ================================================================
    // UPDATE MEMBER ROLE
    // ================================================================
    async updateMemberRole(actorId, teamId, targetUserId, dto) {
        const team = await this.getActiveTeam(teamId);
        this.ensureCaptain(team, actorId);
        const member = await this.prisma.teamMember.findFirst({
            where: { teamId, userId: targetUserId, status: team_types_1.MemberStatus.ACTIVE },
        });
        if (!member)
            throw new common_1.NotFoundException('Участник не найден');
        if (member.role === team_types_1.TeamRole.CAPTAIN) {
            throw new common_1.BadRequestException('Нельзя изменить роль капитана. Используйте передачу капитанства');
        }
        const oldRole = member.role;
        const newRole = dto.role;
        await this.prisma.teamMember.update({
            where: { id: member.id },
            data: { role: newRole },
        });
        const hierarchy = [team_types_1.TeamRole.RECRUIT, team_types_1.TeamRole.MEMBER, team_types_1.TeamRole.VICE_CAPTAIN, team_types_1.TeamRole.CAPTAIN];
        const isPromotion = hierarchy.indexOf(newRole) > hierarchy.indexOf(oldRole);
        const eventName = isPromotion ? team_types_1.TeamDomainEvent.MemberPromoted : team_types_1.TeamDomainEvent.MemberDemoted;
        await this.createAuditLog({
            teamId,
            actorId,
            action: eventName,
            entity: 'team_member',
            entityId: member.id,
            oldValue: { role: oldRole },
            newValue: { role: newRole },
        });
        return { message: `Роль изменена с ${oldRole} на ${newRole}` };
    }
    // ================================================================
    // LEAVE TEAM
    // ================================================================
    async leave(userId, teamId) {
        const team = await this.getActiveTeam(teamId);
        const member = await this.prisma.teamMember.findFirst({
            where: { teamId, userId, status: team_types_1.MemberStatus.ACTIVE },
        });
        if (!member)
            throw new common_1.NotFoundException('Вы не участник этой команды');
        if (member.role === team_types_1.TeamRole.CAPTAIN) {
            throw new common_1.BadRequestException('Капитан не может покинуть команду. Сначала передайте капитанство другому участнику');
        }
        await this.prisma.teamMember.update({
            where: { id: member.id },
            data: { status: team_types_1.MemberStatus.LEFT, leftAt: new Date() },
        });
        await this.createAuditLog({
            teamId,
            actorId: userId,
            action: team_types_1.TeamDomainEvent.MemberLeft,
            entity: 'team_member',
            entityId: member.id,
            oldValue: { userId, role: member.role },
            newValue: { status: team_types_1.MemberStatus.LEFT },
        });
        return { message: 'Вы покинули команду' };
    }
    // ================================================================
    // GET MY TEAM
    // ================================================================
    async getMyTeam(userId) {
        const membership = await this.prisma.teamMember.findFirst({
            where: { userId, status: team_types_1.MemberStatus.ACTIVE },
            include: {
                team: {
                    include: {
                        captain: { select: { id: true, name: true, avatarUrl: true } },
                        members: {
                            where: { status: team_types_1.MemberStatus.ACTIVE },
                            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
                        },
                        _count: { select: { members: { where: { status: team_types_1.MemberStatus.ACTIVE } } } },
                    },
                },
            },
        });
        if (!membership)
            return null;
        const team = membership.team;
        return {
            id: team.id,
            name: team.name,
            slug: team.slug,
            avatar: team.avatar,
            description: team.description,
            captain: team.captain,
            members: team.members.map((m) => ({
                id: m.user.id,
                name: m.user.name,
                avatarUrl: m.user.avatarUrl,
                role: m.role,
                joinedAt: m.joinedAt,
            })),
            membersCount: team._count.members,
            myRole: membership.role,
            joinedAt: membership.joinedAt,
        };
    }
    // ================================================================
    // GET MY TEAMS
    // ================================================================
    async getMyTeams(userId) {
        const memberships = await this.prisma.teamMember.findMany({
            where: { userId, status: team_types_1.MemberStatus.ACTIVE },
            include: {
                team: {
                    include: {
                        captain: { select: { id: true, name: true, avatarUrl: true } },
                        _count: { select: { members: { where: { status: team_types_1.MemberStatus.ACTIVE } } } },
                    },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });
        return memberships.map((m) => ({
            id: m.team.id,
            name: m.team.name,
            slug: m.team.slug,
            avatar: m.team.avatar,
            description: m.team.description,
            captain: m.team.captain,
            membersCount: m.team._count.members,
            myRole: m.role,
            joinedAt: m.joinedAt,
        }));
    }
    // ================================================================
    // GET MEMBERS
    // ================================================================
    async getMembers(teamId) {
        await this.getActiveTeam(teamId);
        const members = await this.prisma.teamMember.findMany({
            where: { teamId, status: team_types_1.MemberStatus.ACTIVE },
            include: { user: { select: { id: true, name: true, avatarUrl: true, city: true } } },
            orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        });
        return members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            avatarUrl: m.user.avatarUrl,
            city: m.user.city,
            role: m.role,
            joinedAt: m.joinedAt,
            lastActiveAt: m.lastActiveAt,
        }));
    }
    // ================================================================
    // GET HISTORY
    // ================================================================
    async getHistory(teamId) {
        await this.getActiveTeam(teamId);
        const logs = await this.prisma.auditLog.findMany({
            where: { entity: 'team', entityId: teamId },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return logs.map((log) => ({
            id: log.id,
            action: log.action,
            actor: log.user,
            oldValue: log.oldValue,
            newValue: log.newValue,
            createdAt: log.createdAt,
        }));
    }
    // ================================================================
    // INVITE USER
    // ================================================================
    async invite(actorId, teamId, dto) {
        const team = await this.getActiveTeam(teamId);
        this.ensureCaptain(team, actorId);
        // Domain Rule: нельзя пригласить уже состоящего участника
        const existingMember = await this.prisma.teamMember.findFirst({
            where: { teamId, userId: dto.userId, status: team_types_1.MemberStatus.ACTIVE },
        });
        if (existingMember) {
            throw new common_1.ConflictException('Пользователь уже является участником команды');
        }
        // Domain Rule: максимум один Pending Invite на пользователя
        const existingInvite = await this.prisma.teamInvite.findFirst({
            where: { teamId, invitedUserId: dto.userId, status: 'PENDING' },
        });
        if (existingInvite) {
            throw new common_1.ConflictException('Пользователю уже отправлено приглашение');
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней
        const invite = await this.prisma.teamInvite.create({
            data: {
                teamId,
                invitedUserId: dto.userId,
                invitedBy: actorId,
                token,
                message: dto.message || null,
                status: 'PENDING',
                expiresAt,
            },
            include: {
                invitedUser: { select: { id: true, name: true, avatarUrl: true } },
            },
        });
        await this.createAuditLog({
            teamId,
            actorId,
            action: team_types_1.TeamDomainEvent.InviteSent,
            entity: 'team_invite',
            entityId: invite.id,
            newValue: { invitedUserId: dto.userId },
        });
        return {
            id: invite.id,
            invitedUser: invite.invitedUser,
            token: invite.token,
            expiresAt: invite.expiresAt,
            message: 'Приглашение отправлено',
        };
    }
    // ================================================================
    // ACCEPT INVITE
    // ================================================================
    async acceptInvite(userId, teamId, inviteId) {
        const invite = await this.prisma.teamInvite.findFirst({
            where: { id: inviteId, teamId, invitedUserId: userId, status: 'PENDING' },
        });
        if (!invite)
            throw new common_1.NotFoundException('Приглашение не найдено');
        if (invite.expiresAt < new Date()) {
            await this.prisma.teamInvite.update({
                where: { id: inviteId },
                data: { status: 'EXPIRED' },
            });
            throw new common_1.BadRequestException('Срок действия приглашения истёк');
        }
        // Domain Rule: нельзя вступить дважды
        const existingMember = await this.prisma.teamMember.findFirst({
            where: { teamId, userId, status: team_types_1.MemberStatus.ACTIVE },
        });
        if (existingMember) {
            throw new common_1.ConflictException('Вы уже являетесь участником команды');
        }
        // Проверка лимита
        const team = await this.getActiveTeam(teamId);
        const activeCount = await this.prisma.teamMember.count({
            where: { teamId, status: team_types_1.MemberStatus.ACTIVE },
        });
        if (activeCount >= team.maxMembers) {
            throw new common_1.BadRequestException('Достигнут лимит участников команды');
        }
        await this.prisma.$transaction([
            this.prisma.teamInvite.update({
                where: { id: inviteId },
                data: { status: 'ACCEPTED' },
            }),
            this.prisma.teamMember.create({
                data: {
                    teamId,
                    userId,
                    role: team_types_1.TeamRole.MEMBER,
                    status: team_types_1.MemberStatus.ACTIVE,
                },
            }),
        ]);
        await this.createAuditLog({
            teamId,
            actorId: userId,
            action: team_types_1.TeamDomainEvent.InviteAccepted,
            entity: 'team_invite',
            entityId: inviteId,
            newValue: { status: 'ACCEPTED' },
        });
        return { message: 'Вы приняли приглашение и вступили в команду' };
    }
    // ================================================================
    // DECLINE INVITE
    // ================================================================
    async declineInvite(userId, teamId, inviteId) {
        const invite = await this.prisma.teamInvite.findFirst({
            where: { id: inviteId, teamId, invitedUserId: userId, status: 'PENDING' },
        });
        if (!invite)
            throw new common_1.NotFoundException('Приглашение не найдено');
        await this.prisma.teamInvite.update({
            where: { id: inviteId },
            data: { status: 'DECLINED' },
        });
        await this.createAuditLog({
            teamId,
            actorId: userId,
            action: team_types_1.TeamDomainEvent.InviteDeclined,
            entity: 'team_invite',
            entityId: inviteId,
            newValue: { status: 'DECLINED' },
        });
        return { message: 'Приглашение отклонено' };
    }
    // ================================================================
    // CREATE JOIN REQUEST
    // ================================================================
    async createJoinRequest(userId, teamId, dto) {
        const team = await this.getActiveTeam(teamId);
        // Domain Rule: нельзя вступить дважды
        const existingMember = await this.prisma.teamMember.findFirst({
            where: { teamId, userId, status: team_types_1.MemberStatus.ACTIVE },
        });
        if (existingMember) {
            throw new common_1.ConflictException('Вы уже являетесь участником команды');
        }
        // Domain Rule: максимум одна Pending Join Request
        const existingRequest = await this.prisma.joinRequest.findFirst({
            where: { teamId, userId, status: 'PENDING' },
        });
        if (existingRequest) {
            throw new common_1.ConflictException('У вас уже есть активная заявка на вступление');
        }
        // Если команда открыта (OPEN) — сразу добавляем
        if (team.joinPolicy === 'OPEN') {
            const activeCount = await this.prisma.teamMember.count({
                where: { teamId, status: team_types_1.MemberStatus.ACTIVE },
            });
            if (activeCount >= team.maxMembers) {
                throw new common_1.BadRequestException('Достигнут лимит участников команды');
            }
            const member = await this.prisma.teamMember.create({
                data: {
                    teamId,
                    userId,
                    role: team_types_1.TeamRole.MEMBER,
                    status: team_types_1.MemberStatus.ACTIVE,
                },
                include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            });
            await this.createAuditLog({
                teamId,
                actorId: userId,
                action: team_types_1.TeamDomainEvent.MemberJoined,
                entity: 'team_member',
                entityId: member.id,
                newValue: { userId, role: team_types_1.TeamRole.MEMBER },
            });
            return {
                status: 'joined',
                message: 'Вы успешно вступили в команду',
                member: {
                    id: member.user.id,
                    name: member.user.name,
                    avatarUrl: member.user.avatarUrl,
                    role: member.role,
                    joinedAt: member.joinedAt,
                },
            };
        }
        // Если APPROVAL — создаём заявку
        const joinRequest = await this.prisma.joinRequest.create({
            data: {
                teamId,
                userId,
                message: dto.message || null,
                status: 'PENDING',
            },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        });
        await this.createAuditLog({
            teamId,
            actorId: userId,
            action: team_types_1.TeamDomainEvent.JoinRequestCreated,
            entity: 'join_request',
            entityId: joinRequest.id,
            newValue: { userId, message: dto.message },
        });
        return {
            id: joinRequest.id,
            status: 'pending',
            message: 'Заявка на вступление отправлена. Ожидайте решения капитана',
        };
    }
    // ================================================================
    // APPROVE JOIN REQUEST
    // ================================================================
    async approveJoinRequest(actorId, teamId, requestId) {
        const team = await this.getActiveTeam(teamId);
        this.ensureCaptain(team, actorId);
        const request = await this.prisma.joinRequest.findFirst({
            where: { id: requestId, teamId, status: 'PENDING' },
        });
        if (!request)
            throw new common_1.NotFoundException('Заявка не найдена');
        const activeCount = await this.prisma.teamMember.count({
            where: { teamId, status: team_types_1.MemberStatus.ACTIVE },
        });
        if (activeCount >= team.maxMembers) {
            throw new common_1.BadRequestException('Достигнут лимит участников команды');
        }
        await this.prisma.$transaction([
            this.prisma.joinRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED', resolvedBy: actorId, resolvedAt: new Date() },
            }),
            this.prisma.teamMember.create({
                data: {
                    teamId,
                    userId: request.userId,
                    role: team_types_1.TeamRole.MEMBER,
                    status: team_types_1.MemberStatus.ACTIVE,
                },
            }),
        ]);
        await this.createAuditLog({
            teamId,
            actorId,
            action: team_types_1.TeamDomainEvent.JoinRequestApproved,
            entity: 'join_request',
            entityId: requestId,
            newValue: { status: 'APPROVED', userId: request.userId },
        });
        return { message: 'Заявка одобрена. Пользователь добавлен в команду' };
    }
    // ================================================================
    // REJECT JOIN REQUEST
    // ================================================================
    async rejectJoinRequest(actorId, teamId, requestId) {
        const team = await this.getActiveTeam(teamId);
        this.ensureCaptain(team, actorId);
        const request = await this.prisma.joinRequest.findFirst({
            where: { id: requestId, teamId, status: 'PENDING' },
        });
        if (!request)
            throw new common_1.NotFoundException('Заявка не найдена');
        await this.prisma.joinRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED', resolvedBy: actorId, resolvedAt: new Date() },
        });
        await this.createAuditLog({
            teamId,
            actorId,
            action: team_types_1.TeamDomainEvent.JoinRequestRejected,
            entity: 'join_request',
            entityId: requestId,
            newValue: { status: 'REJECTED', userId: request.userId },
        });
        return { message: 'Заявка отклонена' };
    }
    // ================================================================
    // TRANSFER OWNERSHIP
    // ================================================================
    async transferOwnership(actorId, teamId, dto) {
        const team = await this.getActiveTeam(teamId);
        this.ensureCaptain(team, actorId);
        // Проверка: целевой пользователь — участник команды
        const targetMember = await this.prisma.teamMember.findFirst({
            where: { teamId, userId: dto.toUserId, status: team_types_1.MemberStatus.ACTIVE },
        });
        if (!targetMember) {
            throw new common_1.BadRequestException('Пользователь не является участником команды');
        }
        // Проверка: нет уже активного Transfer
        const existingTransfer = await this.prisma.ownershipTransfer.findFirst({
            where: { teamId, status: 'PENDING' },
        });
        if (existingTransfer) {
            throw new common_1.ConflictException('Уже есть активный запрос на передачу капитанства');
        }
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней
        const transfer = await this.prisma.ownershipTransfer.create({
            data: {
                teamId,
                fromUserId: actorId,
                toUserId: dto.toUserId,
                status: 'PENDING',
                expiresAt,
            },
        });
        await this.createAuditLog({
            teamId,
            actorId,
            action: team_types_1.TeamDomainEvent.OwnershipTransferred,
            entity: 'ownership_transfer',
            entityId: transfer.id,
            newValue: { fromUserId: actorId, toUserId: dto.toUserId },
        });
        return {
            id: transfer.id,
            message: `Запрос на передачу капитанства отправлен пользователю. Запрос действителен 7 дней`,
            expiresAt,
        };
    }
    // ================================================================
    // ACCEPT TRANSFER
    // ================================================================
    async acceptTransfer(userId, teamId) {
        const transfer = await this.prisma.ownershipTransfer.findFirst({
            where: { teamId, toUserId: userId, status: 'PENDING' },
        });
        if (!transfer)
            throw new common_1.NotFoundException('Запрос на передачу капитанства не найден');
        if (transfer.expiresAt < new Date()) {
            await this.prisma.ownershipTransfer.update({
                where: { id: transfer.id },
                data: { status: 'EXPIRED' },
            });
            throw new common_1.BadRequestException('Срок действия запроса истёк');
        }
        // Domain Rule: капитан всегда является участником команды
        // Меняем роли: старый капитан → MEMBER, новый → CAPTAIN
        await this.prisma.$transaction([
            this.prisma.ownershipTransfer.update({
                where: { id: transfer.id },
                data: { status: 'APPROVED', resolvedAt: new Date() },
            }),
            this.prisma.team.update({
                where: { id: teamId },
                data: { captainId: userId, version: { increment: 1 } },
            }),
            this.prisma.teamMember.updateMany({
                where: { teamId, userId: transfer.fromUserId, status: team_types_1.MemberStatus.ACTIVE },
                data: { role: team_types_1.TeamRole.MEMBER },
            }),
            this.prisma.teamMember.updateMany({
                where: { teamId, userId, status: team_types_1.MemberStatus.ACTIVE },
                data: { role: team_types_1.TeamRole.CAPTAIN },
            }),
        ]);
        await this.createAuditLog({
            teamId,
            actorId: userId,
            action: team_types_1.TeamDomainEvent.CaptainChanged,
            entity: 'team',
            entityId: teamId,
            oldValue: { captainId: transfer.fromUserId },
            newValue: { captainId: userId },
        });
        return { message: 'Капитанство успешно передано' };
    }
    // ================================================================
    // HELPERS
    // ================================================================
    async getActiveTeam(id) {
        if (!isValidUuid(id)) {
            throw new common_1.NotFoundException('Команда не найдена');
        }
        const team = await this.prisma.team.findFirst({
            where: { id, deletedAt: null, status: { not: team_types_1.TeamStatus.DELETED } },
        });
        if (!team)
            throw new common_1.NotFoundException('Команда не найдена');
        return team;
    }
    ensureCaptain(team, userId) {
        if (team.captainId !== userId) {
            throw new common_1.ForbiddenException('Только капитан может выполнить это действие');
        }
    }
    async createAuditLog(data) {
        await this.prisma.auditLog.create({
            data: {
                userId: data.actorId,
                action: data.action,
                entity: data.entity,
                entityId: data.entityId,
                oldValue: (data.oldValue ?? undefined),
                newValue: (data.newValue ?? undefined),
            },
        });
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map