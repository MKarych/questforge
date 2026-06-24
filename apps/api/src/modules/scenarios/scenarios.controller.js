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
var ScenariosController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenariosController = void 0;
const common_1 = require("@nestjs/common");
const scenarios_service_1 = require("./scenarios.service");
const create_scenario_dto_1 = require("./dto/create-scenario.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ScenariosController = ScenariosController_1 = class ScenariosController {
    scenariosService;
    logger = new common_1.Logger(ScenariosController_1.name);
    constructor(scenariosService) {
        this.scenariosService = scenariosService;
    }
    async create(req, dto) {
        return this.scenariosService.create(req.user.userId, dto);
    }
    async findAll(req, published, limit, offset) {
        return this.scenariosService.findAll(req.user.userId, {
            published: published !== undefined ? published === 'true' : undefined,
            limit: Number(limit),
            offset: Number(offset),
        });
    }
    async findOne(req, scenarioId) {
        return this.scenariosService.findOne(req.user.userId, scenarioId);
    }
    async update(req, scenarioId, dto) {
        return this.scenariosService.update(req.user.userId, scenarioId, dto);
    }
    async delete(req, scenarioId) {
        return this.scenariosService.delete(req.user.userId, scenarioId);
    }
    async validate(req, scenarioId) {
        return this.scenariosService.validate(req.user.userId, scenarioId);
    }
    async publish(req, scenarioId, price, licenseType) {
        return this.scenariosService.publish(req.user.userId, scenarioId, price, licenseType);
    }
    async createVersion(req, scenarioId, nodes, versionNote) {
        return this.scenariosService.createVersion(req.user.userId, scenarioId, nodes, versionNote);
    }
};
exports.ScenariosController = ScenariosController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_scenario_dto_1.CreateScenarioDto]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('published')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/validate'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "validate", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('price')),
    __param(3, (0, common_1.Body)('licenseType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, String]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)(':id/version'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('nodes')),
    __param(3, (0, common_1.Body)('versionNote')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array, String]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "createVersion", null);
exports.ScenariosController = ScenariosController = ScenariosController_1 = __decorate([
    (0, common_1.Controller)('scenarios'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [scenarios_service_1.ScenariosService])
], ScenariosController);
//# sourceMappingURL=scenarios.controller.js.map