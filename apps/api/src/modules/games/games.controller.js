"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const games_service_1 = require("./games.service");
const create_game_dto_1 = require("./dto/create-game.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const multer_1 = require("multer");
const path_1 = require("path");
const uuid_1 = require("uuid");
let GamesController = class GamesController {
    gamesService;
    constructor(gamesService) {
        this.gamesService = gamesService;
    }
    // ============================================================
    // Public endpoints (no auth required)
    // ============================================================
    async findAllPublic(city, dateFrom, dateTo, type, sort, limit, offset) {
        return this.gamesService.findAllPublic({
            city,
            dateFrom,
            dateTo,
            type,
            sort,
            limit: Number(limit) || 20,
            offset: Number(offset) || 0,
        });
    }
    async findOneByShareLink(shareLink) {
        return this.gamesService.findOneByShareLink(shareLink);
    }
    async findOnePublic(id) {
        return this.gamesService.findOnePublic(id);
    }
    async findAll(status, city, limit, offset) {
        return this.gamesService.findAll({
            status,
            city,
            limit: Number(limit) || 20,
            offset: Number(offset) || 0,
        });
    }
    async findOne(gameId) {
        return this.gamesService.findOne(gameId);
    }
    async getReviews(gameId, limit, offset) {
        return this.gamesService.getReviews(gameId, {
            limit: Number(limit) || 10,
            offset: Number(offset) || 0,
        });
    }
    async getTeams(gameId, limit, offset) {
        return this.gamesService.getTeams(gameId, {
            limit: Number(limit) || 20,
            offset: Number(offset) || 0,
        });
    }
    // ============================================================
    // Protected endpoints (auth required)
    // ============================================================
    async create(req, dto) {
        return this.gamesService.create(req.user.userId, dto);
    }
    async update(req, gameId, dto) {
        return this.gamesService.update(req.user.userId, gameId, dto);
    }
    async remove(req, gameId) {
        return this.gamesService.remove(req.user.userId, gameId);
    }
    async submitForModeration(req, gameId) {
        return this.gamesService.submitForModeration(req.user.userId, gameId);
    }
    async startGame(req, gameId) {
        return this.gamesService.startGame(req.user.userId, gameId);
    }
    async finishGame(req, gameId) {
        return this.gamesService.finishGame(req.user.userId, gameId);
    }
    async publishGame(req, gameId) {
        return this.gamesService.publishGame(req.user.userId, gameId);
    }
    async uploadCover(req, gameId, file) {
        const userId = req.user?.userId;
        return this.gamesService.uploadCover(userId, gameId, file);
    }
    // ============================================================
    // Admin endpoints (moderation)
    // ============================================================
    async findPendingGames(limit, offset) {
        return this.gamesService.findPendingGames({
            limit: Number(limit) || 20,
            offset: Number(offset) || 0,
        });
    }
    async moderateGame(gameId, body, req) {
        return this.gamesService.moderateGame(gameId, body.status, body.comment, req.user.userId);
    }
    // ============================================================
    // Team registration
    // ============================================================
    async registerTeam(gameId, body, req) {
        return this.gamesService.registerTeam(gameId, body.teamId, req.user.userId);
    }
};
exports.GamesController = GamesController;
__decorate([
    (0, common_1.Get)('public'),
    __param(0, (0, common_1.Query)('city')),
    __param(1, (0, common_1.Query)('dateFrom')),
    __param(2, (0, common_1.Query)('dateTo')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('sort')),
    __param(5, (0, common_1.Query)('limit')),
    __param(6, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "findAllPublic", null);
__decorate([
    (0, common_1.Get)('public/share/:shareLink'),
    __param(0, (0, common_1.Param)('shareLink')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "findOneByShareLink", null);
__decorate([
    (0, common_1.Get)('public/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "findOnePublic", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('city')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/reviews'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "getReviews", null);
__decorate([
    (0, common_1.Get)(':id/teams'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "getTeams", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_game_dto_1.CreateGameDto]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "submitForModeration", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "startGame", null);
__decorate([
    (0, common_1.Post)(':id/finish'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "finishGame", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "publishGame", null);
__decorate([
    (0, common_1.Post)(':id/upload-cover'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './public/uploads/covers',
            filename: (_req, file, callback) => {
                const ext = (0, path_1.extname)(file.originalname);
                const filename = `${(0, uuid_1.v4)()}${ext}`;
                callback(null, filename);
            },
        }),
        fileFilter: (_req, file, callback) => {
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (allowedMimeTypes.includes(file.mimetype)) {
                callback(null, true);
            }
            else {
                callback(new common_1.ForbiddenException('Разрешены только изображения: jpg, png, webp'), false);
            }
        },
        limits: {
            fileSize: 5 * 1024 * 1024, // 5 MB
        },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "uploadCover", null);
__decorate([
    (0, common_1.Get)('admin/pending'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MODERATOR'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "findPendingGames", null);
__decorate([
    (0, common_1.Post)(':id/moderate'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MODERATOR'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "moderateGame", null);
__decorate([
    (0, common_1.Post)(':id/register-team'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "registerTeam", null);
exports.GamesController = GamesController = __decorate([
    (0, common_1.Controller)('games'),
    __metadata("design:paramtypes", [games_service_1.GamesService])
], GamesController);
//# sourceMappingURL=games.controller.js.map