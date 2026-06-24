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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    // ============================================================
    // Dashboard
    // ============================================================
    async getStats() {
        return this.adminService.getStats();
    }
    // ============================================================
    // Games Moderation
    // ============================================================
    async getPendingGames(limit, offset) {
        return this.adminService.getPendingGames({
            limit: Number(limit) || 20,
            offset: Number(offset) || 0,
        });
    }
    async approveGame(gameId, req) {
        const moderatorId = req.user?.userId || req.user?.sub;
        return this.adminService.approveGame(gameId, moderatorId);
    }
    async rejectGame(gameId, reason, req) {
        const moderatorId = req.user?.userId || req.user?.sub;
        return this.adminService.rejectGame(gameId, reason, moderatorId);
    }
    // ============================================================
    // Organizer Applications
    // ============================================================
    async getPendingApplications() {
        return this.adminService.getPendingApplications();
    }
    async approveApplication(applicationId, req) {
        const moderatorId = req.user?.userId || req.user?.sub;
        return this.adminService.approveApplication(applicationId, moderatorId);
    }
    async rejectApplication(applicationId, reason, req) {
        const moderatorId = req.user?.userId || req.user?.sub;
        return this.adminService.rejectApplication(applicationId, reason, moderatorId);
    }
    // ============================================================
    // Users Management (ADMIN only)
    // ============================================================
    async getUsers(search, limit, offset) {
        return this.adminService.getUsers({
            search,
            limit: Number(limit) || 20,
            offset: Number(offset) || 0,
        });
    }
    async blockUser(userId) {
        return this.adminService.blockUser(userId);
    }
    async unblockUser(userId) {
        return this.adminService.unblockUser(userId);
    }
    async changeUserRole(userId, role) {
        return this.adminService.changeUserRole(userId, role);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MODERATOR'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('games/pending'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MODERATOR'),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingGames", null);
__decorate([
    (0, common_1.Post)('games/:id/approve'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MODERATOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveGame", null);
__decorate([
    (0, common_1.Post)('games/:id/reject'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MODERATOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectGame", null);
__decorate([
    (0, common_1.Get)('organizer-applications'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MODERATOR'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingApplications", null);
__decorate([
    (0, common_1.Post)('organizer-applications/:id/approve'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MODERATOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveApplication", null);
__decorate([
    (0, common_1.Post)('organizer-applications/:id/reject'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MODERATOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectApplication", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Patch)('users/:id/block'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "blockUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/unblock'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "unblockUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/role'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "changeUserRole", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map