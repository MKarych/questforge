import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteUserDto } from './dto/invite-user.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTeamDto) {
    const existingTeam = await this.prisma.team.findFirst({
      where: { captainId: userId },
    });

    if (existingTeam) {
      throw new BadRequestException('У вас уже есть команда');
    }

    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        description: dto.description,
        captainId: userId,
      },
      include: {
        captain: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    await this.prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId,
        role: 'captain',
        status: 'active',
      },
    });

    return {
      id: team.id,
      name: team.name,
      captainId: team.captainId,
      description: team.description,
      createdAt: team.createdAt,
    };
  }

  async findAll(query: { city?: string; limit?: number; offset?: number }) {
    const { city, limit = 20, offset = 0 } = query;
    const where: Record<string, unknown> = {};
    if (city) where.captain = { city };

    const [items, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          captain: { select: { id: true, name: true, avatarUrl: true, city: true } },
          members: { where: { status: 'active' }, select: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.team.count({ where }),
    ]);

    return {
      items: items.map((team) => ({
        id: team.id,
        name: team.name,
        captain: team.captain,
        membersCount: team.members.length,
        rating: 0,
        createdAt: team.createdAt,
      })),
      total,
    };
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        captain: { select: { id: true, name: true, avatarUrl: true, email: true, city: true } },
        members: {
          where: { status: 'active' },
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!team) throw new NotFoundException('Команда не найдена');

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      captain: { id: team.captain.id, name: team.captain.name, avatarUrl: team.captain.avatarUrl },
      members: team.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        avatarUrl: member.user.avatarUrl,
        role: member.role,
        joinedAt: member.joinedAt,
      })),
      rating: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      createdAt: team.createdAt,
    };
  }

  async invite(captainId: string, teamId: string, dto: InviteUserDto) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Команда не найдена');
    if (team.captainId !== captainId) throw new ForbiddenException('Только капитан может приглашать');

    const existingMember = await this.prisma.teamMember.findFirst({ where: { teamId, userId: dto.userId } });
    if (existingMember) throw new BadRequestException('Пользователь уже состоит в команде');

    const member = await this.prisma.teamMember.create({
      data: { teamId, userId: dto.userId, role: 'member', status: 'pending' },
    });

    return { status: 'invited', inviteId: member.id, message: 'Приглашение отправлено' };
  }

  async join(userId: string, teamId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Команда не найдена');

    const member = await this.prisma.teamMember.findFirst({ where: { teamId, userId } });
    if (!member) throw new BadRequestException('Приглашение не найдено');
    if (member.status !== 'pending') throw new BadRequestException('Некорректный статус');

    await this.prisma.teamMember.update({ where: { id: member.id }, data: { status: 'active' } });
    return { status: 'joined', teamId, message: 'Вы успешно вступили в команду' };
  }

  async leave(userId: string, teamId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Команда не найдена');

    const member = await this.prisma.teamMember.findFirst({ where: { teamId, userId } });
    if (!member) throw new NotFoundException('Вы не состоите в этой команде');
    if (member.role === 'captain') throw new BadRequestException('Капитан не может покинуть команду');

    await this.prisma.teamMember.update({ where: { id: member.id }, data: { status: 'left', leftAt: new Date() } });
    return { status: 'left', message: 'Вы покинули команду' };
  }

  async removeMember(captainId: string, teamId: string, targetUserId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Команда не найдена');
    if (team.captainId !== captainId) throw new ForbiddenException('Только капитан может исключать');
    if (targetUserId === captainId) throw new BadRequestException('Нельзя исключить капитана');

    const member = await this.prisma.teamMember.findFirst({ where: { teamId, userId: targetUserId } });
    if (!member) throw new NotFoundException('Участник не найден');

    await this.prisma.teamMember.update({ where: { id: member.id }, data: { status: 'kicked', leftAt: new Date() } });
    return { status: 'removed', message: 'Участник исключен из команды' };
  }

  async getMyTeam(userId: string) {
    const membership = await this.prisma.teamMember.findFirst({
      where: { userId, status: 'active' },
      include: {
        team: {
          include: {
            captain: { select: { id: true, name: true, avatarUrl: true } },
            members: { where: { status: 'active' }, include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
          },
        },
      },
    });

    if (!membership) return null;

    const team = membership.team;
    return {
      id: team.id,
      name: team.name,
      captain: { id: team.captain.id, name: team.captain.name, avatarUrl: team.captain.avatarUrl },
      members: team.members.map((m) => ({ id: m.user.id, name: m.user.name, avatarUrl: m.user.avatarUrl, role: m.role })),
      myRole: membership.role,
      joinedAt: membership.joinedAt,
    };
  }
}
