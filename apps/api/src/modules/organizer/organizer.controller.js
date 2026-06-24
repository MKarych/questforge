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
exports.OrganizerController = void 0;
const common_1 = require("@nestjs/common");
const organizer_service_1 = require("./organizer.service");
const create_organizer_application_dto_1 = require("./dto/create-organizer-application.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let OrganizerController = class OrganizerController {
    organizerService;
    constructor(organizerService) {
        this.organizerService = organizerService;
    }
    async apply(req, dto) {
        return this.organizerService.apply(req.user.userId, dto);
    }
    async getStatus(req) {
        return this.organizerService.getStatus(req.user.userId);
    }
    async findAllApplications() {
        return this.organizerService.findAllApplications();
    }
    async reviewApplication(id, body, req) {
        return this.organizerService.reviewApplication(id, body.status, body.rejectionReason, req.user.userId);
    }
};
exports.OrganizerController = OrganizerController;
__decorate([
    (0, common_1.Post)('apply'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_organizer_application_dto_1.CreateOrganizerApplicationDto]),
    __metadata("design:returntype", Promise)
], OrganizerController.prototype, "apply", null);
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrganizerController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('admin/applications'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MODERATOR'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrganizerController.prototype, "findAllApplications", null);
__decorate([
    (0, common_1.Patch)('admin/applications/:id/review'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MODERATOR'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OrganizerController.prototype, "reviewApplication", null);
exports.OrganizerController = OrganizerController = __decorate([
    (0, common_1.Controller)('organizer'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [organizer_service_1.OrganizerService])
], OrganizerController);
//# sourceMappingURL=organizer.controller.js.map