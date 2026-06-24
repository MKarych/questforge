import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        token: string;
        refreshToken: string;
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
    }>;
    login(dto: LoginDto): Promise<{
        token: string;
        refreshToken: string;
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
    }>;
    refreshToken(refreshToken: string): Promise<{
        token: string;
        refreshToken: string;
    }>;
    getProfile(userId: string): Promise<{
        id: any;
        uuid: any;
        email: any;
        username: any;
        name: any;
        slug: any;
        avatarUrl: any;
        avatar: any;
        city: any;
        bio: any;
        role: any;
        roles: any;
        status: any;
        organizerStatus: any;
        rating: any;
        trustScore: any;
        reputation: any;
        achievements: any;
        gamesCreated: any;
        scenariosCreated: any;
        gamesConducted: any;
        language: any;
        timezone: any;
        theme: any;
        socialLinks: any;
        createdAt: any;
        lastLoginAt: any;
        lastSeenAt: any;
        stats: {
            gamesPlayed: number;
            gamesCompleted: number;
            averageScore: number;
        };
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    private generateTokens;
}
//# sourceMappingURL=auth.service.d.ts.map