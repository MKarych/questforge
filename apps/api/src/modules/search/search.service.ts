import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { $Enums } from '@prisma/client';

export interface SearchResultItem {
  id: string;
  type: 'game' | 'user' | 'team';
  label: string;
  description?: string;
  href: string;
  imageUrl?: string;
}

export interface SearchResults {
  games: SearchResultItem[];
  users: SearchResultItem[];
  teams: SearchResultItem[];
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, limit = 10): Promise<SearchResults> {
    if (!query || !query.trim()) {
      return { games: [], users: [], teams: [] };
    }

    const trimmed = query.trim();

    const [games, users, teams] = await Promise.all([
      this.searchGames(trimmed, limit),
      this.searchUsers(trimmed, limit),
      this.searchTeams(trimmed, limit),
    ]);

    return { games, users, teams };
  }

  private async searchGames(query: string, limit: number): Promise<SearchResultItem[]> {
    try {
      const games = await this.prisma.game.findMany({
        where: {
          deletedAt: null,
          status: {
            notIn: [
              $Enums.GameStatus.DRAFT,
              $Enums.GameStatus.CANCELLED,
              $Enums.GameStatus.ARCHIVED,
              $Enums.GameStatus.HIDDEN,
              $Enums.GameStatus.BLOCKED,
            ],
          },
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          title: true,
          city: true,
          imageUrl: true,
          slug: true,
        },
      });

      return games.map((game) => ({
        id: game.id,
        type: 'game' as const,
        label: game.title,
        description: game.city || undefined,
        href: `/games/${game.slug || game.id}`,
        imageUrl: game.imageUrl || undefined,
      }));
    } catch (error) {
      this.logger.error(`Error searching games: ${error}`);
      return [];
    }
  }

  private async searchUsers(query: string, limit: number): Promise<SearchResultItem[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          deletedAt: null,
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { lastSeenAt: 'desc' },
        select: {
          id: true,
          username: true,
          name: true,
          city: true,
          avatarUrl: true,
        },
      });

      return users.map((user) => ({
        id: user.id,
        type: 'user' as const,
        label: user.name || user.username,
        description: user.city || undefined,
        href: `/profile/${user.id}`,
        imageUrl: user.avatarUrl || undefined,
      }));
    } catch (error) {
      this.logger.error(`Error searching users: ${error}`);
      return [];
    }
  }

  private async searchTeams(query: string, limit: number): Promise<SearchResultItem[]> {
    try {
      const teams = await this.prisma.team.findMany({
        where: {
          deletedAt: null,
          status: { not: 'DELETED' },
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          city: true,
          avatar: true,
          slug: true,
        },
      });

      return teams.map((team) => ({
        id: team.id,
        type: 'team' as const,
        label: team.name,
        description: team.city || team.description || undefined,
        href: `/teams/${team.slug || team.id}`,
        imageUrl: team.avatar || undefined,
      }));
    } catch (error) {
      this.logger.error(`Error searching teams: ${error}`);
      return [];
    }
  }
}