import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteUserDto } from './dto/invite-user.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создать новую команду (в рамках игры)
   */
  async create(userId: string, dto: CreateTeamDto, gameId: string) {
    // Проверяем, нет ли уже команды от этого капитана в этой игре
    const existingTeam = await this.prisma.team.findFirst({
      where: {
        gameId,
        captainId: userId,
      },
    });

    if (existingTeam) {
      throw new BadRequestException('У вас уже есть команда в этой игре');
    }

    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        gameId,
        captainId: userId,
      },
      include: {
        captain: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Создаем запись участника для капитана
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
      createdAt: team.createdAt,
    };
  }

  /**
   * Получить список команд с пагинацией
   */
  async findAll(query: { gameId?: string; city?: string; limit?: number; offset?: number }) {
    const { gameId, city, limit = 20, offset = 0 } = query;

    const where: Record<string, unknown> = {};
    if (gameId) {
      where.gameId = gameId;
    }
    if (city) {
      where.captain = { city };
    }

    const [items, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          captain: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              city: true,
            },
          },
          members: {
            where: { status: 'active' },
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.team.count({ where }),
    ]);

    return {
      items: items.map((team: any) => ({
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

  /**
   * Получить детали команды по ID
   */
  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        captain: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            email: true,
            city: true,
          },
        },
        members: {
          where: { status: 'active' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    return {
      id: team.id,
      name: team.name,
      captain: {
        id: team.captain.id,
        name: team.captain.name,
        avatarUrl: team.captain.avatarUrl,
      },
      members: team.members.map((member: any) => ({
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

  /**
   * Пригласить пользователя в команду (только капитан)
   */
  async invite(captainId: string, teamId: string, dto: InviteUserDto) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    if (team.captainId !== captainId) {
      throw new ForbiddenException('Только капитан может приглашать участников');
    }

    // Проверяем, не состоит ли уже пользователь в команде
    const existingMember = await this.prisma.teamMember.findUnique({
      where: {
        team_member_unique: {
          teamId,
          userId: dto.userId,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('Пользователь уже состоит в команде');
    }

    // Создаем участника со статусом pending
    const member = await this.prisma.teamMember.create({
      data: {
        teamId,
        userId: dto.userId,
        role: 'member',
        status: 'pending',
      },
    });

    return {
      status: 'invited',
      inviteId: member.id,
      message: 'Приглашение отправлено',
    };
  }

  /**
   * Вступить в команду по приглашению
   */
  async join(userId: string, teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    const member = await this.prisma.teamMember.findUnique({
      where: {
        team_member_unique: {
          teamId,
          userId,
        },
      },
    });

    if (!member) {
      throw new BadRequestException('Приглашение не найдено');
    }

    if (member.status !== 'pending') {
      throw new BadRequestException('Некорректный статус приглашения');
    }

    // Активируем участника
    await this.prisma.teamMember.update({
      where: { id: member.id },
      data: {
        status: 'active',
      },
    });

    return {
      status: 'joined',
      teamId,
      message: 'Вы успешно вступили в команду',
    };
  }

  /**
   * Покинуть команду
   */
  async leave(userId: string, teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    const member = await this.prisma.teamMember.findUnique({
      where: {
        team_member_unique: {
          teamId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Вы не состоите в этой команде');
    }

    if (member.role === 'captain') {
      throw new BadRequestException('Капитан не может покинуть команду. Передайте капитанство другому участнику или распустите команду.');
    }

    await this.prisma.teamMember.update({
      where: { id: member.id },
      data: {
        status: 'left',
        leftAt: new Date(),
      },
    });

    return {
      status: 'left',
      message: 'Вы покинули команду',
    };
  }

  /**
   * Исключить участника из команды (только капитан)
   */
  async removeMember(captainId: string, teamId: string, targetUserId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    if (team.captainId !== captainId) {
      throw new ForbiddenException('Только капитан может исключать участников');
    }

    if (targetUserId === captainId) {
      throw new BadRequestException('Нельзя исключить капитана');
    }

    const member = await this.prisma.teamMember.findUnique({
      where: {
        team_member_unique: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Участник не найден в команде');
    }

    await this.prisma.teamMember.update({
      where: { id: member.id },
      data: {
        status: 'kicked',
        leftAt: new Date(),
      },
    });

    return {
      status: 'removed',
      message: 'Участник исключен из команды',
    };
  }

  /**
   * Получить мою команду
   */
  async getMyTeam(userId: string) {
    const membership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        status: 'active',
      },
      include: {
        team: {
          include: {
            captain: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            members: {
              where: { status: 'active' },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return null;
    }

    const team = membership.team;

    return {
      id: team.id,
      name: team.name,
      captain: {
        id: team.captain.id,
        name: team.captain.name,
        avatarUrl: team.captain.avatarUrl,
      },
      members: team.members.map((m: any) => ({
        id: m.user.id,
        name: m.user.name,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
      })),
      myRole: membership.role,
      joinedAt: membership.joinedAt,
    };
  }
}
