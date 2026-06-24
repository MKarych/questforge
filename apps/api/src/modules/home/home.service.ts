import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getHomePage() {
    const [
      featuredGames,
      popularGames,
      recentGames,
      trendingGames,
      topOrganizers,
      topTeams,
      recentWinners,
      recentReviews,
      stats,
    ] = await Promise.all([
      this.getFeaturedGames(),
      this.getPopularGames(),
      this.getRecentGames(),
      this.getTrendingGames(),
      this.getTopOrganizers(),
      this.getTopTeams(),
      this.getRecentWinners(),
      this.getRecentReviews(),
      this.getStats(),
    ]);

    return {
      hero: {
        title: 'Город Приключений',
        subtitle: 'Городские игры нового поколения',
        ctaText: 'Выбрать игру',
        ctaLink: '/games',
        secondaryCtaText: 'Стать организатором',
        secondaryCtaLink: '/organizer',
      },
      stats,
      games: {
        featured: featuredGames,
        popular: popularGames,
        recent: recentGames,
        trending: trendingGames,
      },
      categories: [],
      topOrganizers,
      topTeams,
      recentWinners,
      recentReviews,
      faq: [],
      featureFlags: {
        search: true,
        notifications: true,
        marketplace: false,
        ai: false,
        reviews: true,
        chat: false,
        liveActivity: true,
        mapPreview: false,
        partners: false,
        press: false,
        downloadApp: false,
      },
      systemStatus: {
        status: 'online',
        message: '',
      },
    };
  }

  private async getFeaturedGames() {
    const games = await this.prisma.game.findMany({
      where: {
        moderationStatus: 'APPROVED',
        deletedAt: null,
        publishedAt: { not: null },
      },
      take: 4,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        city: true,
        date: true,
        duration: true,
        price: true,
        maxTeams: true,
        shareLink: true,
        status: true,
        imageUrl: true,
        publishedAt: true,
        organizer: {
          select: { id: true, name: true, avatarUrl: true },
        },
        _count: { select: { gameTeams: true, reviews: true } },
      },
    });

    return games.map((g) => ({
      ...g,
      price: Number(g.price),
      averageRating: 0,
      reviewsCount: g._count.reviews,
      teamsCount: g._count.gameTeams,
    }));
  }

  private async getPopularGames() {
    const games = await this.prisma.game.findMany({
      where: {
        moderationStatus: 'APPROVED',
        deletedAt: null,
        publishedAt: { not: null },
      },
      take: 4,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        city: true,
        date: true,
        duration: true,
        price: true,
        maxTeams: true,
        shareLink: true,
        status: true,
        imageUrl: true,
        publishedAt: true,
        organizer: {
          select: { id: true, name: true, avatarUrl: true },
        },
        _count: { select: { gameTeams: true, reviews: true } },
      },
    });

    return games.map((g) => ({
      ...g,
      price: Number(g.price),
      averageRating: 0,
      reviewsCount: g._count.reviews,
      teamsCount: g._count.gameTeams,
    }));
  }

  private async getRecentGames() {
    const games = await this.prisma.game.findMany({
      where: {
        moderationStatus: 'APPROVED',
        deletedAt: null,
        publishedAt: { not: null },
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        city: true,
        date: true,
        duration: true,
        price: true,
        maxTeams: true,
        shareLink: true,
        status: true,
        imageUrl: true,
        publishedAt: true,
        organizer: {
          select: { id: true, name: true, avatarUrl: true },
        },
        _count: { select: { gameTeams: true, reviews: true } },
      },
    });

    return games.map((g) => ({
      ...g,
      price: Number(g.price),
      averageRating: 0,
      reviewsCount: g._count.reviews,
      teamsCount: g._count.gameTeams,
    }));
  }

  private async getTrendingGames() {
    const games = await this.prisma.game.findMany({
      where: {
        moderationStatus: 'APPROVED',
        deletedAt: null,
        publishedAt: { not: null },
      },
      take: 3,
      orderBy: { date: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        city: true,
        date: true,
        duration: true,
        price: true,
        maxTeams: true,
        shareLink: true,
        status: true,
        imageUrl: true,
        publishedAt: true,
        organizer: {
          select: { id: true, name: true, avatarUrl: true },
        },
        _count: { select: { gameTeams: true, reviews: true } },
      },
    });

    return games.map((g) => ({
      ...g,
      price: Number(g.price),
      averageRating: 0,
      reviewsCount: g._count.reviews,
      teamsCount: g._count.gameTeams,
    }));
  }

  private async getTopOrganizers() {
    const organizers = await this.prisma.user.findMany({
      where: {
        role: { in: ['ORGANIZER', 'ADMIN'] },
        deletedAt: null,
      },
      take: 4,
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        rating: true,
        gamesCreated: true,
        _count: { select: { reviews: true } },
      },
    });

    return organizers.map((u) => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      rating: u.rating,
      gamesCount: u.gamesCreated,
      reviewsCount: u._count.reviews,
    }));
  }

  private async getTopTeams() {
    const teams = await this.prisma.team.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      take: 4,
      orderBy: { score: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        avatar: true,
        score: true,
        city: true,
        _count: { select: { members: true } },
      },
    });

    return teams.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      avatar: t.avatar,
      rating: t.score,
      wins: 0,
      membersCount: t._count.members,
      city: t.city,
    }));
  }

  private async getRecentWinners() {
    // Берём последние завершённые GameTeam с сортировкой по score
    const gameTeams = await this.prisma.gameTeam.findMany({
      take: 3,
      orderBy: { joinedAt: 'desc' },
      select: {
        team: { select: { id: true, name: true } },
        game: { select: { id: true, title: true } },
        joinedAt: true,
      },
    });

    return gameTeams.map((gt) => ({
      teamName: gt.team.name,
      gameName: gt.game.title,
      gameId: gt.game.id,
      wonAt: gt.joinedAt.toISOString(),
    }));
  }

  private async getRecentReviews() {
    const reviews = await this.prisma.review.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        text: true,
        createdAt: true,
        user: { select: { name: true, avatarUrl: true } },
      },
    });

    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt.toISOString(),
      user: r.user,
    }));
  }

  private async getStats() {
    const [gamesCount, teamsCount, playersCount, citiesResult, organizersCount] =
      await Promise.all([
        this.prisma.game.count({
          where: { moderationStatus: 'APPROVED', deletedAt: null },
        }),
        this.prisma.team.count({
          where: { status: 'ACTIVE', deletedAt: null },
        }),
        this.prisma.user.count({
          where: { deletedAt: null },
        }),
        this.prisma.game.findMany({
          where: { moderationStatus: 'APPROVED', deletedAt: null },
          select: { city: true },
          distinct: ['city'],
        }),
        this.prisma.user.count({
          where: {
            role: { in: ['ORGANIZER', 'ADMIN'] },
            deletedAt: null,
          },
        }),
      ]);

    return {
      games: gamesCount,
      teams: teamsCount,
      players: playersCount,
      cities: citiesResult.length,
      organizers: organizersCount,
    };
  }
}