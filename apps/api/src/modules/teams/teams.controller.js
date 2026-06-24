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
exports.TeamsController = void 0;
const common_1 = require("@nestjs/common");
const teams_service_1 = require("./teams.service");
const create_team_dto_1 = require("./dto/create-team.dto");
const update_team_dto_1 = require("./dto/update-team.dto");
const invite_user_dto_1 = require("./dto/invite-user.dto");
const create_join_request_dto_1 = require("./dto/create-join-request.dto");
const transfer_ownership_dto_1 = require("./dto/transfer-ownership.dto");
const update_member_role_dto_1 = require("./dto/update-member-role.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let TeamsController = class TeamsController {
    teamsService;
    constructor(teamsService) {
        this.teamsService = teamsService;
    }
    // ================================================================
    // CREATE
    // ================================================================
    async create(req, dto) {
        const result = await this.teamsService.create(req.user.userId, dto);
        return { success: true, data: result };
    }
    // ================================================================
    // FIND ALL (public)
    // ================================================================
    async findAll(city, search, status, tags, limit, offset) {
        const result = await this.teamsService.findAll({
            city,
            search,
            status: status,
            tags: tags ? tags.split(',') : undefined,
            limit: limit ? Number(limit) : 20,
            offset: offset ? Number(offset) : 0,
        });
        return { success: true, data: result };
    }
    // ================================================================
    // GET MY TEAM (static routes MUST be before :id)
    // ================================================================
    async getMyTeam(req) {
        const result = await this.teamsService.getMyTeam(req.user.userId);
        return { success: true, data: result };
    }
    // ================================================================
    // GET MY TEAMS
    // ================================================================
    async getMyTeams(req) {
        const result = await this.teamsService.getMyTeams(req.user.userId);
        return { success: true, data: result };
    }
    // ================================================================
    // FIND ONE (public)
    // ================================================================
    async findOne(id) {
        const result = await this.teamsService.findOne(id);
        return { success: true, data: result };
    }
    // ================================================================
    // FIND PRIVATE (for members)
    // ================================================================
    async findPrivate(req, id) {
        const result = await this.teamsService.findPrivate(id, req.user.userId);
        return { success: true, data: result };
    }
    // ================================================================
    // UPDATE
    // ================================================================
    async update(req, id, dto) {
        const result = await this.teamsService.update(req.user.userId, id, dto);
        return { success: true, data: result };
    }
    // ================================================================
    // DELETE (Soft Delete)
    // ================================================================
    async delete(req, id) {
        const result = await this.teamsService.delete(req.user.userId, id);
        return { success: true, data: result };
    }
    // ================================================================
    // GET MEMBERS
    // ================================================================
    async getMembers(id) {
        const result = await this.teamsService.getMembers(id);
        return { success: true, data: result };
    }
    // ================================================================
    // UPDATE MEMBER ROLE
    // ================================================================
    async updateMemberRole(req, id, userId, dto) {
        const result = await this.teamsService.updateMemberRole(req.user.userId, id, userId, dto);
        return { success: true, data: result };
    }
    // ================================================================
    // REMOVE MEMBER
    // ================================================================
    async removeMember(req, id, userId) {
        const result = await this.teamsService.removeMember(req.user.userId, id, userId);
        return { success: true, data: result };
    }
    // ================================================================
    // JOIN REQUEST (подать заявку)
    // ================================================================
    async createJoinRequest(req, id, dto) {
        const result = await this.teamsService.createJoinRequest(req.user.userId, id, dto);
        return { success: true, data: result };
    }
    // ================================================================
    // APPROVE JOIN REQUEST
    // ================================================================
    async approveJoinRequest(req, id, requestId) {
        const result = await this.teamsService.approveJoinRequest(req.user.userId, id, requestId);
        return { success: true, data: result };
    }
    // ================================================================
    // REJECT JOIN REQUEST
    // ================================================================
    async rejectJoinRequest(req, id, requestId) {
        const result = await this.teamsService.rejectJoinRequest(req.user.userId, id, requestId);
        return { success: true, data: result };
    }
    // ================================================================
    // LEAVE TEAM
    // ================================================================
    async leave(req, id) {
        const result = await this.teamsService.leave(req.user.userId, id);
        return { success: true, data: result };
    }
    // ================================================================
    // INVITE USER
    // ================================================================
    async invite(req, id, dto) {
        const result = await this.teamsService.invite(req.user.userId, id, dto);
        return { success: true, data: result };
    }
    // ================================================================
    // ACCEPT INVITE
    // ================================================================
    async acceptInvite(req, id, inviteId) {
        const result = await this.teamsService.acceptInvite(req.user.userId, id, inviteId);
        return { success: true, data: result };
    }
    // ================================================================
    // DECLINE INVITE
    // ================================================================
    async declineInvite(req, id, inviteId) {
        const result = await this.teamsService.declineInvite(req.user.userId, id, inviteId);
        return { success: true, data: result };
    }
    // ================================================================
    // TRANSFER OWNERSHIP
    // ================================================================
    async transferOwnership(req, id, dto) {
        const result = await this.teamsService.transferOwnership(req.user.userId, id, dto);
        return { success: true, data: result };
    }
    // ================================================================
    // ACCEPT TRANSFER
    // ================================================================
    async acceptTransfer(req, id) {
        const result = await this.teamsService.acceptTransfer(req.user.userId, id);
        return { success: true, data: result };
    }
    // ================================================================
    // GET HISTORY
    // ================================================================
    async getHistory(id) {
        const result = await this.teamsService.getHistory(id);
        return { success: true, data: result };
    }
};
exports.TeamsController = TeamsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_team_dto_1.CreateTeamDto]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('city')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('tags')),
    __param(4, (0, common_1.Query)('limit')),
    __param(5, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('me/team'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "getMyTeam", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "getMyTeams", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/private'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "findPrivate", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_team_dto_1.UpdateTeamDto]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Patch)(':id/members/:userId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('userId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_member_role_dto_1.UpdateMemberRoleDto]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "updateMemberRole", null);
__decorate([
    (0, common_1.Delete)(':id/members/:userId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_join_request_dto_1.CreateJoinRequestDto]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "createJoinRequest", null);
__decorate([
    (0, common_1.Post)(':id/join/:requestId/approve'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "approveJoinRequest", null);
__decorate([
    (0, common_1.Post)(':id/join/:requestId/reject'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "rejectJoinRequest", null);
__decorate([
    (0, common_1.Post)(':id/leave'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "leave", null);
__decorate([
    (0, common_1.Post)(':id/invite'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, invite_user_dto_1.InviteUserDto]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "invite", null);
__decorate([
    (0, common_1.Post)(':id/invite/:inviteId/accept'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('inviteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "acceptInvite", null);
__decorate([
    (0, common_1.Post)(':id/invite/:inviteId/decline'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('inviteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "declineInvite", null);
__decorate([
    (0, common_1.Post)(':id/transfer'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, transfer_ownership_dto_1.TransferOwnershipDto]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "transferOwnership", null);
__decorate([
    (0, common_1.Post)(':id/transfer/accept'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "acceptTransfer", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "getHistory", null);
exports.TeamsController = TeamsController = __decorate([
    (0, common_1.Controller)('teams'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [teams_service_1.TeamsService])
], TeamsController);
//# sourceMappingURL=teams.controller.js.map