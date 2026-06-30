import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly activityService: ActivityService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Check agreeToTerms
    if (!dto.agreeToTerms) {
      throw new BadRequestException('Вы должны согласиться с условиями использования');
    }

    // 2. Check captcha
    if (dto.captchaAnswer === undefined || dto.captchaAnswer === null) {
      throw new BadRequestException('Пожалуйста, решите капчу');
    }

    // Validate captcha: simple math — sum of two random numbers
    // We use a simple approach: the captcha is validated on backend by checking
    // that the answer is a number between 2 and 20 (since it's sum of 1-10 + 1-10)
    if (typeof dto.captchaAnswer !== 'number' || dto.captchaAnswer < 2 || dto.captchaAnswer > 20) {
      throw new BadRequestException('Неверный ответ капчи');
    }

    // 3. Check username uniqueness
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Этот логин уже занят');
    }

    // 4. Check email uniqueness
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    // 5. Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 6. Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 7. Generate slug from username
    const slug = dto.username.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').substring(0, 150);

    // 8. Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        name: dto.name,
        slug,
        isEmailVerified: false,
        verificationToken,
      },
    });

    // 9. Log verification link to console (stub for email sending)
    this.logger.log(`🔑 Токен верификации для ${dto.email}: ${verificationToken}`);
    this.logger.log(`🔗 Ссылка для подтверждения: http://localhost:3001/auth/verify-email?token=${verificationToken}`);

    // 10. Create activity event
    await this.activityService.createEvent(
      'USER_REGISTERED',
      user.id,
      user.name || user.username,
      null,
      { email: user.email },
    );

    // 11. Generate JWT
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken: tokens.token,
    };
  }

  async login(dto: LoginDto) {
    // Find user by username OR email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: dto.login },
          { email: dto.login },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const result: any = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken: tokens.token,
    };

    // Если email не подтверждён — добавляем предупреждение, но пускаем
    if (!user.isEmailVerified) {
      result.warning = 'Ваш email не подтверждён. Проверьте почту и перейдите по ссылке для подтверждения.';
    }

    return result;
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Неверный или устаревший токен верификации');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
      },
    });

    return { message: 'Email успешно подтверждён' };
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
      name: u.name,
      slug: u.slug,
      isEmailVerified: u.isEmailVerified,
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

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      this.logger.log(`🔑 Токен сброса пароля для ${email}: ${resetToken}`);
      this.logger.log(`🔗 Ссылка для сброса: http://localhost:3001/auth/reset-password?token=${resetToken}`);
      // TODO: Отправка реального письма через сервис почты
    }

    return {
      message: 'Если аккаунт с таким email существует, мы отправили ссылку для восстановления пароля',
    };
  }

  async logout(userId: string) {
    this.logger.log(`User ${userId} logged out`);
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: { id: string; email: string; username: string; role: string }) {
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, username: user.username, role: user.role },
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
