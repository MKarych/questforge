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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfileDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateProfileDto {
    name;
    city;
    bio;
    telegram;
    vk;
    whatsapp;
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Имя должно быть строкой' }),
    (0, class_validator_1.MinLength)(2, { message: 'Имя должно содержать минимум 2 символа' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Имя не может быть длиннее 100 символов' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Город должен быть строкой' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Город не может быть длиннее 100 символов' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'О себе должно быть строкой' }),
    (0, class_validator_1.MaxLength)(1000, { message: 'О себе не может быть длиннее 1000 символов' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "bio", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Telegram должен быть строкой' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Telegram не может быть длиннее 100 символов' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "telegram", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'VK должен быть строкой' }),
    (0, class_validator_1.MaxLength)(255, { message: 'VK не может быть длиннее 255 символов' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "vk", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'WhatsApp должен быть строкой' }),
    (0, class_validator_1.MaxLength)(100, { message: 'WhatsApp не может быть длиннее 100 символов' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "whatsapp", void 0);
//# sourceMappingURL=update-profile.dto.js.map