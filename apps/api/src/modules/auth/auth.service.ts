import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Generate username and slug from name
    const username = dto.name.toLowerCase().replace(/[^\w]/g, '_').substring(0, 100);
    const slug = username.replace(/[_\s]+/g, '-').substring(0, 150);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        username,
        slug,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.secret'),
        audience: this.configService.get('jwt.audience'),
        issuer: this.configService.get('jwt.issuer'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = await this.generateTokens(user);
      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const u: any = user;
    const profile = u.profile || {};
    const settings = u.settings || {};
    const rep = u.reputationData || {};

    // Get user stats
    const gamesPlayed = await this.prisma.team.count({
      where: {
        members: {
          some: { userId, status: 'ACTIVE' },
        },
      },
    });

    return {
      id: u.id,
      uuid: u.id,
      email: u.email,
      username: u.username,
      name: u.username,
      slug: u.slug,
      avatarUrl: profile.avatar || u.avatarUrl || null,
      avatar: profile.avatar || u.avatarUrl || null,
      city: profile.city || u.city || '',
      bio: profile.bio || u.bio || '',
      role: u.role,
      roles: u.roles,
      status: u.status,
      organizerStatus: u.organizerStatus,
      rating: rep.rating || u.rating || 0,
      trustScore: rep.trustScore || 0,
      reputation: u.reputation || 0,
      achievements: rep.achievements || u.legacyAchievements || [],
      gamesCreated: u.gamesCreated,
      scenariosCreated: u.scenariosCreated,
      gamesConducted: u.gamesConducted,
      language: settings.language || 'ru',
      timezone: settings.timezone || 'Europe/Moscow',
      theme: settings.theme || 'dark',
      socialLinks: profile.socialLinks || {},
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      lastSeenAt: u.lastSeenAt,
      stats: {
        gamesPlayed,
        gamesCompleted: 0,
        averageScore: 0,
      },
    };
  }

  async logout(userId: string) {
    // In a production system, you would blacklist the token here
    // For now, just log the logout event
    this.logger.log(`User ${userId} logged out`);
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: { id: string; email: string; role: string }) {
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.configService.get('jwt.secret'),
        audience: this.configService.get('jwt.audience'),
        issuer: this.configService.get('jwt.issuer'),
        expiresIn: this.configService.get('jwt.accessTokenTtl'),
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.configService.get('jwt.secret'),
        audience: this.configService.get('jwt.audience'),
        issuer: this.configService.get('jwt.issuer'),
        expiresIn: this.configService.get('jwt.refreshTokenTtl'),
      },
    );

    return {
      token: accessToken,
      refreshToken,
    };
  }
}
