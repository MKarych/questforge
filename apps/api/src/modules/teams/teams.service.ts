import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import {
  TeamRole,
  TeamStatus,
  TeamVisibility,
  MemberStatus,
  TeamDomainEvent,
} from './types/team-types';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 150);
}

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  // ================================================================
  // CREATE
  // ================================================================
  async create(userId: string, dto: CreateTeamDto) {
    const existingCaptainTeam = await this.prisma.team.findFirst({
      where: { captainId: userId, deletedAt: null, status: { not: TeamStatus.DELETED } },
    });
    if (existingCaptainTeam) {
      throw new BadRequestException('Вы уже являетесь капитаном другой команды');
    }

    const existingName = await this.prisma.team.findFirst({
      where: { name: dto.name, deletedAt: null },
    });
    if (existingName) {
      throw new ConflictException('Команда с таким названием уже существует');
    }

    let slug = dto.slug || slugify(dto.name);
    const existingSlug = await this.prisma.team.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${uuidv4().substring(0, 8)}`;
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
        status: TeamStatus.ACTIVE,
        privacy: dto.privacy || TeamVisibility.PUBLIC,
        joinPolicy: dto.joinPolicy || 'INVITE_ONLY',
        tags: dto.tags || [],
        members: {
          create: {
            userId,
            role: TeamRole.CAPTAIN,
            status: MemberStatus.ACTIVE,
          },
        },
      },
      include: {
        captain: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          where: { status: MemberStatus.ACTIVE },
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    });

    await this.createAuditLog({
      teamId: team.id,
      actorId: userId,
      action: TeamDomainEvent.TeamCreated,
      entity: 'team',
      entityId: team.id,
      newValue: { name: team.name, slug: team.slug },
    });

    await this.activityService.createEvent(
      'TEAM_CREATED',
      userId,
      team.captain?.name || 'Пользователь',
      team.captain?.avatarUrl || null,
      { teamId: team.id, teamName: team.name },
    );

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
  async findAll(query: {
    city?: string;
    status?: TeamStatus;
    search?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }) {
    const { city, status, search, tags, limit = 20, offset = 0 } = query;

    const where: Record<string, unknown> = {
      deletedAt: null,
      status: { not: TeamStatus.DELETED },
    };

    if (city) where.city = city;
    if (status) where.status = status;
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
          _count: { select: { members: { where: { status: MemberStatus.ACTIVE } } } },
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
  async findOne(id: string) {
    if (!isValidUuid(id)) {
      throw new NotFoundException('Команда не найдена');
    }
    const team = await this.prisma.team.findFirst({
      where: { id, deletedAt: null, status: { not: TeamStatus.DELETED } },
      include: {
        captain: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          where: { status: MemberStatus.ACTIVE },
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        },
        _count: { select: { members: { where: { status: MemberStatus.ACTIVE } } } },
      },
    });

    if (!team) throw new NotFoundException('Команда не найдена');

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
  async findPrivate(id: string, userId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id, deletedAt: null, status: { not: TeamStatus.DELETED } },
      include: {
        captain: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          where: { status: MemberStatus.ACTIVE },
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
        _count: { select: { members: { where: { status: MemberStatus.ACTIVE } } } },
      },
    });

    if (!team) throw new NotFoundException('Команда не найдена');

    const isMember = team.members.some((m) => m.userId === userId);
    if (!isMember && team.captainId !== userId) {
      throw new ForbiddenException('Только участники команды могут просматривать приватные данные');
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
  async update(actorId: string, teamId: string, dto: UpdateTeamDto) {
    const team = await this.getActiveTeam(teamId);
    this.ensureCaptain(team, actorId);

    const data: Record<string, unknown> = {};
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      const existing = await this.prisma.team.findFirst({
        where: { name: dto.name, id: { not: teamId }, deletedAt: null },
      });
      if (existing) throw new ConflictException('Команда с таким названием уже существует');
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
          where: { status: MemberStatus.ACTIVE },
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        _count: { select: { members: { where: { status: MemberStatus.ACTIVE } } } },
      },
    });

    await this.createAuditLog({
      teamId,
      actorId,
      action: TeamDomainEvent.TeamUpdated,
      entity: 'team',
      entityId: teamId,
      oldValue: oldValues,
      newValue: newValues,
    });

    if (dto.privacy && dto.privacy !== team.privacy) {
      await this.createAuditLog({
        teamId,
        actorId,
        action: TeamDomainEvent.VisibilityChanged,
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
  async delete(actorId: string, teamId: string) {
    const team = await this.getActiveTeam(teamId);
    this.ensureCaptain(team, actorId);

    const activeMembersCount = await this.prisma.teamMember.count({
      where: { teamId, status: MemberStatus.ACTIVE, userId: { not: actorId } },
    });
    if (activeMembersCount > 0) {
      throw new BadRequestException(
        'Нельзя удалить команду с активными участниками. Сначала исключите всех участников.',
      );
    }

    await this.prisma.team.update({
      where: { id: teamId },
      data: {
        deletedAt: new Date(),
        status: TeamStatus.DELETED,
        version: { increment: 1 },
      },
    });

    await this.createAuditLog({
      teamId,
      actorId,
      action: TeamDomainEvent.TeamDeleted,
      entity: 'team',
      entityId: teamId,
      oldValue: { status: team.status },
      newValue: { status: TeamStatus.DELETED },
    });

    return { message: 'Команда удалена' };
  }

  // ================================================================
  // ADD MEMBER
  // ================================================================
  async addMember(actorId: string, teamId: string, userId: string) {
    const team = await this.getActiveTeam(teamId);
    this.ensureCaptain(team, actorId);

    const existingMember = await this.prisma.teamMember.findFirst({
      where: { teamId, userId, status: MemberStatus.ACTIVE },
    });
    if (existingMember) {
      throw new ConflictException('Пользователь уже является участником команды');
    }

    const activeCount = await this.prisma.teamMember.count({
      where: { teamId, status: MemberStatus.ACTIVE },
    });
    if (activeCount >= team.maxMembers) {
      throw new BadRequestException('Достигнут лимит участников команды');
    }

    const member = await this.prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role: TeamRole.MEMBER,
        status: MemberStatus.ACTIVE,
      },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    await this.createAuditLog({
      teamId,
      actorId,
      action: TeamDomainEvent.MemberJoined,
      entity: 'team_member',
      entityId: member.id,
      newValue: { userId, role: TeamRole.MEMBER },
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
  async removeMember(actorId: string, teamId: string, targetUserId: string) {
    const team = await this.getActiveTeam(teamId);
    this.ensureCaptain(team, actorId);

    if (targetUserId === actorId) {
      throw new BadRequestException('Капитан не может исключить себя. Используйте передачу капитанства');
    }

    const targetMember = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: targetUserId, status: MemberStatus.ACTIVE },
    });
    if (!targetMember) throw new NotFoundException('Участник не найден');
    if (targetMember.role === TeamRole.CAPTAIN) {
      throw new BadRequestException('Нельзя исключить капитана');
    }

    await this.prisma.teamMember.update({
      where: { id: targetMember.id },
      data: { status: MemberStatus.KICKED, leftAt: new Date() },
    });

    await this.createAuditLog({
      teamId,
      actorId,
      action: TeamDomainEvent.MemberKicked,
      entity: 'team_member',
      entityId: targetMember.id,
      oldValue: { userId: targetUserId, role: targetMember.role },
      newValue: { status: MemberStatus.KICKED },
    });

    return { message: 'Участник исключён из команды' };
  }

  // ================================================================
  // UPDATE MEMBER ROLE
  // ================================================================
  async updateMemberRole(actorId: string, teamId: string, targetUserId: string, dto: UpdateMemberRoleDto) {
    const team = await this.getActiveTeam(teamId);
    this.ensureCaptain(team, actorId);

    const member = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: targetUserId, status: MemberStatus.ACTIVE },
    });
    if (!member) throw new NotFoundException('Участник не найден');

    if (member.role === TeamRole.CAPTAIN) {
      throw new BadRequestException('Нельзя изменить роль капитана. Используйте передачу капитанства');
    }

    const oldRole = member.role as TeamRole;
    const newRole = dto.role;

    await this.prisma.teamMember.update({
      where: { id: member.id },
      data: { role: newRole },
    });

    const hierarchy = [TeamRole.RECRUIT, TeamRole.MEMBER, TeamRole.VICE_CAPTAIN, TeamRole.CAPTAIN];
    const isPromotion = hierarchy.indexOf(newRole) > hierarchy.indexOf(oldRole);
    const eventName = isPromotion ? TeamDomainEvent.MemberPromoted : TeamDomainEvent.MemberDemoted;

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
  async leave(userId: string, teamId: string) {
    const team = await this.getActiveTeam(teamId);

    const member = await this.prisma.teamMember.findFirst({
      where: { teamId, userId, status: MemberStatus.ACTIVE },
    });
    if (!member) throw new NotFoundException('Вы не участник этой команды');

    if (member.role === TeamRole.CAPTAIN) {
      throw new BadRequestException(
        'Капитан не может покинуть команду. Сначала передайте капитанство другому участнику',
      );
    }

    await this.prisma.teamMember.update({
      where: { id: member.id },
      data: { status: MemberStatus.LEFT, leftAt: new Date() },
    });

    await this.createAuditLog({
      teamId,
      actorId: userId,
      action: TeamDomainEvent.MemberLeft,
      entity: 'team_member',
      entityId: member.id,
      oldValue: { userId, role: member.role },
      newValue: { status: MemberStatus.LEFT },
    });

    return { message: 'Вы покинули команду' };
  }

  // ================================================================
  // GET MY TEAM
  // ================================================================
  async getMyTeam(userId: string) {
    const membership = await this.prisma.teamMember.findFirst({
      where: { userId, status: MemberStatus.ACTIVE },
      include: {
        team: {
          include: {
            captain: { select: { id: true, name: true, avatarUrl: true } },
            members: {
              where: { status: MemberStatus.ACTIVE },
              include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            },
            _count: { select: { members: { where: { status: MemberStatus.ACTIVE } } } },
          },
        },
      },
    });

    if (!membership) return null;

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
  async getMyTeams(userId: string) {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId, status: MemberStatus.ACTIVE },
      include: {
        team: {
          include: {
            captain: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { members: { where: { status: MemberStatus.ACTIVE } } } },
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
  async getMembers(teamId: string) {
    await this.getActiveTeam(teamId);

    const members = await this.prisma.teamMember.findMany({
      where: { teamId, status: MemberStatus.ACTIVE },
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
  async getHistory(teamId: string) {
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
  async invite(actorId: string, teamId: string, dto: InviteUserDto) {
    const team = await this.getActiveTeam(teamId);
    this.ensureCaptain(team, actorId);

    // Domain Rule: нельзя пригласить уже состоящего участника
    const existingMember = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: dto.userId, status: MemberStatus.ACTIVE },
    });
    if (existingMember) {
      throw new ConflictException('Пользователь уже является участником команды');
    }

    // Domain Rule: максимум один Pending Invite на пользователя
    const existingInvite = await this.prisma.teamInvite.findFirst({
      where: { teamId, invitedUserId: dto.userId, status: 'PENDING' },
    });
    if (existingInvite) {
      throw new ConflictException('Пользователю уже отправлено приглашение');
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
      action: TeamDomainEvent.InviteSent,
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
  async acceptInvite(userId: string, teamId: string, inviteId: string) {
    const invite = await this.prisma.teamInvite.findFirst({
      where: { id: inviteId, teamId, invitedUserId: userId, status: 'PENDING' },
    });
    if (!invite) throw new NotFoundException('Приглашение не найдено');

    if (invite.expiresAt < new Date()) {
      await this.prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Срок действия приглашения истёк');
    }

    // Domain Rule: нельзя вступить дважды
    const existingMember = await this.prisma.teamMember.findFirst({
      where: { teamId, userId, status: MemberStatus.ACTIVE },
    });
    if (existingMember) {
      throw new ConflictException('Вы уже являетесь участником команды');
    }

    // Проверка лимита
    const team = await this.getActiveTeam(teamId);
    const activeCount = await this.prisma.teamMember.count({
      where: { teamId, status: MemberStatus.ACTIVE },
    });
    if (activeCount >= team.maxMembers) {
      throw new BadRequestException('Достигнут лимит участников команды');
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
          role: TeamRole.MEMBER,
          status: MemberStatus.ACTIVE,
        },
      }),
    ]);

    await this.createAuditLog({
      teamId,
      actorId: userId,
      action: TeamDomainEvent.InviteAccepted,
      entity: 'team_invite',
      entityId: inviteId,
      newValue: { status: 'ACCEPTED' },
    });

    return { message: 'Вы приняли приглашение и вступили в команду' };
  }

  // ================================================================
  // DECLINE INVITE
  // ================================================================
  async declineInvite(userId: string, teamId: string, inviteId: string) {
    const invite = await this.prisma.teamInvite.findFirst({
      where: { id: inviteId, teamId, invitedUserId: userId, status: 'PENDING' },
    });
    if (!invite) throw new NotFoundException('Приглашение не найдено');

    await this.prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: 'DECLINED' },
    });

    await this.createAuditLog({
      teamId,
      actorId: userId,
      action: TeamDomainEvent.InviteDeclined,
      entity: 'team_invite',
      entityId: inviteId,
      newValue: { status: 'DECLINED' },
    });

    return { message: 'Приглашение отклонено' };
  }

  // ================================================================
  // CREATE JOIN REQUEST
  // ================================================================
  async createJoinRequest(userId: string, teamId: string, dto: CreateJoinRequestDto) {
    const team = await this.getActiveTeam(teamId);

    // Domain Rule: нельзя вступить дважды
    const existingMember = await this.prisma.teamMember.findFirst({
      where: { teamId, userId, status: MemberStatus.ACTIVE },
    });
    if (existingMember) {
      throw new ConflictException('Вы уже являетесь участником команды');
    }

    // Domain Rule: максимум одна Pending Join Request
    const existingRequest = await this.prisma.joinRequest.findFirst({
      where: { teamId, userId, status: 'PENDING' },
    });
    if (existingRequest) {
      throw new ConflictException('У вас уже есть активная заявка на вступление');
    }

    // Если команда открыта (OPEN) — сразу добавляем
    if (team.joinPolicy === 'OPEN') {
      const activeCount = await this.prisma.teamMember.count({
        where: { teamId, status: MemberStatus.ACTIVE },
      });
      if (activeCount >= team.maxMembers) {
        throw new BadRequestException('Достигнут лимит участников команды');
      }

      const member = await this.prisma.teamMember.create({
        data: {
          teamId,
          userId,
          role: TeamRole.MEMBER,
          status: MemberStatus.ACTIVE,
        },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      });

      await this.createAuditLog({
        teamId,
        actorId: userId,
        action: TeamDomainEvent.MemberJoined,
        entity: 'team_member',
        entityId: member.id,
        newValue: { userId, role: TeamRole.MEMBER },
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
      action: TeamDomainEvent.JoinRequestCreated,
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
  async approveJoinRequest(actorId: string, teamId: string, requestId: string) {
    const team = await this.getActiveTeam(teamId);
    this.ensureCaptain(team, actorId);

    const request = await this.prisma.joinRequest.findFirst({
      where: { id: requestId, teamId, status: 'PENDING' },
    });
    if (!request) throw new NotFoundException('Заявка не найдена');

    const activeCount = await this.prisma.teamMember.count({
      where: { teamId, status: MemberStatus.ACTIVE },
    });
    if (activeCount >= team.maxMembers) {
      throw new BadRequestException('Достигнут лимит участников команды');
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
          role: TeamRole.MEMBER,
          status: MemberStatus.ACTIVE,
        },
      }),
    ]);

    await this.createAuditLog({
      teamId,
      actorId,
      action: TeamDomainEvent.JoinRequestApproved,
      entity: 'join_request',
      entityId: requestId,
      newValue: { status: 'APPROVED', userId: request.userId },
    });

    return { message: 'Заявка одобрена. Пользователь добавлен в команду' };
  }

  // ================================================================
  // REJECT JOIN REQUEST
  // ================================================================
  async rejectJoinRequest(actorId: string, teamId: string, requestId: string) {
    const team = await this.getActiveTeam(teamId);
    this.ensureCaptain(team, actorId);

    const request = await this.prisma.joinRequest.findFirst({
      where: { id: requestId, teamId, status: 'PENDING' },
    });
    if (!request) throw new NotFoundException('Заявка не найдена');

    await this.prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', resolvedBy: actorId, resolvedAt: new Date() },
    });

    await this.createAuditLog({
      teamId,
      actorId,
      action: TeamDomainEvent.JoinRequestRejected,
      entity: 'join_request',
      entityId: requestId,
      newValue: { status: 'REJECTED', userId: request.userId },
    });

    return { message: 'Заявка отклонена' };
  }

  // ================================================================
  // TRANSFER OWNERSHIP
  // ================================================================
  async transferOwnership(actorId: string, teamId: string, dto: TransferOwnershipDto) {
    const team = await this.getActiveTeam(teamId);
    this.ensureCaptain(team, actorId);

    // Проверка: целевой пользователь — участник команды
    const targetMember = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: dto.toUserId, status: MemberStatus.ACTIVE },
    });
    if (!targetMember) {
      throw new BadRequestException('Пользователь не является участником команды');
    }

    // Проверка: нет уже активного Transfer
    const existingTransfer = await this.prisma.ownershipTransfer.findFirst({
      where: { teamId, status: 'PENDING' },
    });
    if (existingTransfer) {
      throw new ConflictException('Уже есть активный запрос на передачу капитанства');
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
      action: TeamDomainEvent.OwnershipTransferred,
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
  async acceptTransfer(userId: string, teamId: string) {
    const transfer = await this.prisma.ownershipTransfer.findFirst({
      where: { teamId, toUserId: userId, status: 'PENDING' },
    });
    if (!transfer) throw new NotFoundException('Запрос на передачу капитанства не найден');

    if (transfer.expiresAt < new Date()) {
      await this.prisma.ownershipTransfer.update({
        where: { id: transfer.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Срок действия запроса истёк');
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
        where: { teamId, userId: transfer.fromUserId, status: MemberStatus.ACTIVE },
        data: { role: TeamRole.MEMBER },
      }),
      this.prisma.teamMember.updateMany({
        where: { teamId, userId, status: MemberStatus.ACTIVE },
        data: { role: TeamRole.CAPTAIN },
      }),
    ]);

    await this.createAuditLog({
      teamId,
      actorId: userId,
      action: TeamDomainEvent.CaptainChanged,
      entity: 'team',
      entityId: teamId,
      oldValue: { captainId: transfer.fromUserId },
      newValue: { captainId: userId },
    });

    return { message: 'Капитанство успешно передано' };
  }

  // ================================================================
  // ADMIN METHODS
  // ================================================================

  async getAllTeams(query: {
    search?: string;
    status?: string;
    city?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { deletedAt: null };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        include: {
          captain: { select: { id: true, name: true, avatarUrl: true, email: true } },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit || 20,
        skip: query.offset || 0,
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
        status: team.status,
        privacy: team.privacy,
        captain: {
          id: team.captain.id,
          name: team.captain.name,
          avatarUrl: team.captain.avatarUrl,
          email: team.captain.email,
        },
        membersCount: team._count.members,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        deletedAt: team.deletedAt,
      })),
      total,
    };
  }

  async getTeamDetails(id: string) {
    if (!isValidUuid(id)) {
      throw new NotFoundException('Команда не найдена');
    }

    const team = await this.prisma.team.findFirst({
      where: { id, deletedAt: null },
      include: {
        captain: { select: { id: true, name: true, avatarUrl: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, email: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { members: true, invites: true, joinRequests: true } },
      },
    });

    if (!team) throw new NotFoundException('Команда не найдена');

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
      status: team.status,
      privacy: team.privacy,
      joinPolicy: team.joinPolicy,
      tags: team.tags,
      captain: {
        id: team.captain.id,
        name: team.captain.name,
        avatarUrl: team.captain.avatarUrl,
        email: team.captain.email,
      },
      members: team.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        avatarUrl: m.user.avatarUrl,
        email: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      membersCount: team._count.members,
      invitesCount: team._count.invites,
      joinRequestsCount: team._count.joinRequests,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      deletedAt: team.deletedAt,
    };
  }

  async adminUpdateTeam(actorId: string, teamId: string, dto: UpdateTeamDto) {
    const team = await this.getActiveTeam(teamId);

    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      oldValues.name = team.name;
      newValues.name = dto.name;
    }
    if (dto.description !== undefined) {
      oldValues.description = team.description;
      newValues.description = dto.description;
    }
    if (dto.city !== undefined) {
      oldValues.city = team.city;
      newValues.city = dto.city;
    }
    if (dto.status !== undefined) {
      oldValues.status = team.status;
      newValues.status = dto.status;
    }
    if (dto.privacy !== undefined) {
      oldValues.privacy = team.privacy;
      newValues.privacy = dto.privacy;
    }
    if (dto.joinPolicy !== undefined) {
      oldValues.joinPolicy = team.joinPolicy;
      newValues.joinPolicy = dto.joinPolicy;
    }
    if (dto.tags !== undefined) {
      oldValues.tags = team.tags;
      newValues.tags = dto.tags;
    }

    const updated = await this.prisma.team.update({
      where: { id: teamId, version: team.version },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.status !== undefined && { status: dto.status as TeamStatus }),
        ...(dto.privacy !== undefined && { privacy: dto.privacy as any }),
        ...(dto.joinPolicy !== undefined && { joinPolicy: dto.joinPolicy as any }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        version: { increment: 1 },
      },
      include: {
        captain: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { members: true } },
      },
    });

    await this.createAuditLog({
      teamId,
      actorId,
      action: 'ADMIN_UPDATE_TEAM',
      entity: 'Team',
      entityId: teamId,
      oldValue: oldValues,
      newValue: newValues,
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      city: updated.city,
      status: updated.status,
      privacy: updated.privacy,
      joinPolicy: updated.joinPolicy,
      tags: updated.tags,
      captain: updated.captain,
      membersCount: updated._count.members,
      updatedAt: updated.updatedAt,
    };
  }

  async adminDeleteTeam(actorId: string, teamId: string) {
    const team = await this.getActiveTeam(teamId);

    await this.prisma.team.update({
      where: { id: teamId, version: team.version },
      data: {
        status: TeamStatus.DELETED,
        deletedAt: new Date(),
        version: { increment: 1 },
      },
    });

    await this.createAuditLog({
      teamId,
      actorId,
      action: 'ADMIN_DELETE_TEAM',
      entity: 'Team',
      entityId: teamId,
      oldValue: { name: team.name, status: team.status },
      newValue: { status: TeamStatus.DELETED, deletedAt: new Date().toISOString() },
    });

    return { message: 'Команда удалена' };
  }

  async adminRestoreTeam(actorId: string, teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    if (team.status !== TeamStatus.DELETED) {
      throw new ConflictException('Команда не была удалена');
    }

    await this.prisma.team.update({
      where: { id: teamId },
      data: {
        status: TeamStatus.ACTIVE,
        deletedAt: null,
        version: { increment: 1 },
      },
    });

    await this.createAuditLog({
      teamId,
      actorId,
      action: 'ADMIN_RESTORE_TEAM',
      entity: 'Team',
      entityId: teamId,
      oldValue: { status: TeamStatus.DELETED, deletedAt: team.deletedAt?.toISOString() },
      newValue: { status: TeamStatus.ACTIVE, deletedAt: null },
    });

    return { message: 'Команда восстановлена' };
  }

  // ================================================================
  // HELPERS
  // ================================================================

  private async getActiveTeam(id: string) {
    if (!isValidUuid(id)) {
      throw new NotFoundException('Команда не найдена');
    }
    const team = await this.prisma.team.findFirst({
      where: { id, deletedAt: null, status: { not: TeamStatus.DELETED } },
    });
    if (!team) throw new NotFoundException('Команда не найдена');
    return team;
  }

  private ensureCaptain(team: { captainId: string }, userId: string) {
    if (team.captainId !== userId) {
      throw new ForbiddenException('Только капитан может выполнить это действие');
    }
  }

  private async createAuditLog(data: {
    teamId: string;
    actorId: string;
    action: string;
    entity: string;
    entityId: string;
    oldValue?: Record<string, unknown> | null;
    newValue?: Record<string, unknown> | null;
  }) {
    await this.prisma.auditLog.create({
      data: {
        userId: data.actorId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldValue: (data.oldValue ?? undefined) as any,
        newValue: (data.newValue ?? undefined) as any,
      },
    });
  }
}
