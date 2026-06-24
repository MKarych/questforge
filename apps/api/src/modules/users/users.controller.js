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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    // ============================================================
    // PUBLIC PROFILE
    // ============================================================
    async getPublicProfile(userId) {
        return this.usersService.getPublicProfile(userId);
    }
    // ============================================================
    // PRIVATE PROFILE
    // ============================================================
    async getMyProfile(req) {
        return this.usersService.getMyProfile(req.user.userId);
    }
    // ============================================================
    // UPDATE PROFILE
    // ============================================================
    async updateProfile(req, dto) {
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];
        return this.usersService.updateProfile(req.user.userId, dto, ip, userAgent);
    }
    // ============================================================
    // AVATAR
    // ============================================================
    async updateAvatar(req, body) {
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];
        return this.usersService.updateAvatar(req.user.userId, body.avatarUrl, ip, userAgent);
    }
    async deleteAvatar(req) {
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];
        return this.usersService.deleteAvatar(req.user.userId, ip, userAgent);
    }
    // ============================================================
    // SOFT DELETE
    // ============================================================
    async deleteUser(req) {
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];
        return this.usersService.deleteUser(req.user.userId, ip, userAgent);
    }
    // ============================================================
    // FOLLOW SYSTEM
    // ============================================================
    async getFollowers(userId, limit, offset) {
        return this.usersService.getFollowers(userId, Number(limit) || 20, Number(offset) || 0);
    }
    async getFollowing(userId, limit, offset) {
        return this.usersService.getFollowing(userId, Number(limit) || 20, Number(offset) || 0);
    }
    async followUser(req, followingId) {
        return this.usersService.followUser(req.user.userId, followingId);
    }
    async unfollowUser(req, followingId) {
        return this.usersService.unfollowUser(req.user.userId, followingId);
    }
    // ============================================================
    // FAVORITES
    // ============================================================
    async getFavorites(userId) {
        return this.usersService.getFavorites(userId);
    }
    async addFavorite(req, category, itemId) {
        return this.usersService.addFavorite(req.user.userId, category, itemId);
    }
    async removeFavorite(req, category, itemId) {
        return this.usersService.removeFavorite(req.user.userId, category, itemId);
    }
    // ============================================================
    // ACTIVITY FEED
    // ============================================================
    async getActivityFeed(userId, limit, offset) {
        return this.usersService.getActivityFeed(userId, Number(limit) || 20, Number(offset) || 0);
    }
    // ============================================================
    // USER'S TEAMS
    // ============================================================
    async getUserTeams(userId) {
        return this.usersService.getUserTeams(userId);
    }
    // ============================================================
    // USER'S SCENARIOS
    // ============================================================
    async getUserScenarios(userId, limit, offset) {
        return this.usersService.getUserScenarios(userId, Number(limit) || 20, Number(offset) || 0);
    }
    // ============================================================
    // ACHIEVEMENTS
    // ============================================================
    async getUserAchievements(userId) {
        return this.usersService.getUserAchievements(userId);
    }
    async checkAchievements(req) {
        return this.usersService.checkAndAwardAchievements(req.user.userId);
    }
    // ============================================================
    // REVIEWS
    // ============================================================
    async getUserReviews(userId, limit, offset) {
        return this.usersService.getUserReviews(userId, Number(limit) || 20, Number(offset) || 0);
    }
    // ============================================================
    // ADMIN PROFILE
    // ============================================================
    async getAdminProfile(userId) {
        return this.usersService.getAdminProfile(userId);
    }
    // ============================================================
    // TRUST SCORE & CAPABILITIES (recalculate)
    // ============================================================
    async recalculateTrustScore(req) {
        return this.usersService.recalculateTrustScore(req.user.userId);
    }
    async recalculateCapabilities(req) {
        return this.usersService.recalculateCapabilities(req.user.userId);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getPublicProfile", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('me/avatar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateAvatar", null);
__decorate([
    (0, common_1.Delete)('me/avatar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteAvatar", null);
__decorate([
    (0, common_1.Delete)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Get)(':id/followers'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getFollowers", null);
__decorate([
    (0, common_1.Get)(':id/following'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getFollowing", null);
__decorate([
    (0, common_1.Post)(':id/follow'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "followUser", null);
__decorate([
    (0, common_1.Delete)(':id/follow'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "unfollowUser", null);
__decorate([
    (0, common_1.Get)(':id/favorites'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getFavorites", null);
__decorate([
    (0, common_1.Post)('me/favorites/:category/:itemId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('category')),
    __param(2, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addFavorite", null);
__decorate([
    (0, common_1.Delete)('me/favorites/:category/:itemId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('category')),
    __param(2, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "removeFavorite", null);
__decorate([
    (0, common_1.Get)(':id/activity'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getActivityFeed", null);
__decorate([
    (0, common_1.Get)(':id/teams'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserTeams", null);
__decorate([
    (0, common_1.Get)(':id/scenarios'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserScenarios", null);
__decorate([
    (0, common_1.Get)(':id/achievements'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserAchievements", null);
__decorate([
    (0, common_1.Post)('me/check-achievements'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "checkAchievements", null);
__decorate([
    (0, common_1.Get)(':id/reviews'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserReviews", null);
__decorate([
    (0, common_1.Get)(':id/admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAdminProfile", null);
__decorate([
    (0, common_1.Post)('me/recalculate-trust'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "recalculateTrustScore", null);
__decorate([
    (0, common_1.Post)('me/recalculate-capabilities'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "recalculateCapabilities", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map