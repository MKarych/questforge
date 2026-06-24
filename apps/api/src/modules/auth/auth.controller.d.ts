import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRequest } from '../../common/types/user-request.type';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    refresh(refreshToken: string): Promise<{
        token: string;
        refreshToken: string;
    }>;
    getProfile(req: UserRequest): Promise<{
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
    logout(req: UserRequest): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=auth.controller.d.ts.map