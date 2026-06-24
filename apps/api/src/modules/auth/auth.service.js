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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(dto) {
        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
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
    async login(dto) {
        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        // Verify password
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
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
    async refreshToken(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('jwt.secret'),
                audience: this.configService.get('jwt.audience'),
                issuer: this.configService.get('jwt.issuer'),
            });
            if (payload.type !== 'refresh') {
                throw new common_1.UnauthorizedException('Invalid token type');
            }
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            const tokens = await this.generateTokens(user);
            return tokens;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const u = user;
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
            achievements: rep.achievements || u.achievements || [],
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
    async logout(userId) {
        // In a production system, you would blacklist the token here
        // For now, just log the logout event
        this.logger.log(`User ${userId} logged out`);
        return { message: 'Logged out successfully' };
    }
    async generateTokens(user) {
        const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role }, {
            secret: this.configService.get('jwt.secret'),
            audience: this.configService.get('jwt.audience'),
            issuer: this.configService.get('jwt.issuer'),
            expiresIn: this.configService.get('jwt.accessTokenTtl'),
        });
        const refreshToken = this.jwtService.sign({ sub: user.id, type: 'refresh' }, {
            secret: this.configService.get('jwt.secret'),
            audience: this.configService.get('jwt.audience'),
            issuer: this.configService.get('jwt.issuer'),
            expiresIn: this.configService.get('jwt.refreshTokenTtl'),
        });
        return {
            token: accessToken,
            refreshToken,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map