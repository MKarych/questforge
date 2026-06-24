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
var UploadController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const uuid_1 = require("uuid");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const users_service_1 = require("../users/users.service");
let UploadController = UploadController_1 = class UploadController {
    usersService;
    logger = new common_1.Logger(UploadController_1.name);
    constructor(usersService) {
        this.usersService = usersService;
    }
    async uploadAvatar(file, req) {
        if (!file) {
            throw new common_1.BadRequestException('Файл не загружен');
        }
        const avatarUrl = `/uploads/avatars/${file.filename}`;
        this.logger.log(`Avatar uploaded for user ${req.user.userId}: ${avatarUrl}`);
        // Сохраняем URL аватара в профиле пользователя
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];
        const result = await this.usersService.updateAvatar(req.user.userId, avatarUrl, ip, userAgent);
        // Возвращаем avatarUrl в формате, который ожидает фронтенд
        return { avatarUrl: result.avatarUrl };
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)('avatar'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (0, path_1.join)(process.cwd(), 'public', 'uploads', 'avatars'),
            filename: (_req, file, callback) => {
                const ext = (0, path_1.extname)(file.originalname).toLowerCase();
                const name = `avatar-${(0, uuid_1.v4)()}${ext}`;
                callback(null, name);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        fileFilter: (_req, file, callback) => {
            const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedMimes.includes(file.mimetype)) {
                return callback(new common_1.BadRequestException('Допустимы только JPG, PNG, WEBP'), false);
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadAvatar", null);
exports.UploadController = UploadController = UploadController_1 = __decorate([
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map