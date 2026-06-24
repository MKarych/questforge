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
exports.CreateOrganizerApplicationDto = void 0;
const class_validator_1 = require("class-validator");
class CreateOrganizerApplicationDto {
    city;
    phone;
    telegram;
    experience;
}
exports.CreateOrganizerApplicationDto = CreateOrganizerApplicationDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Город должен быть строкой' }),
    (0, class_validator_1.MinLength)(2, { message: 'Город должен содержать минимум 2 символа' }),
    __metadata("design:type", String)
], CreateOrganizerApplicationDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Телефон должен быть строкой' }),
    (0, class_validator_1.MinLength)(10, { message: 'Телефон должен содержать минимум 10 символов' }),
    (0, class_validator_1.MaxLength)(20, { message: 'Телефон не может быть длиннее 20 символов' }),
    __metadata("design:type", String)
], CreateOrganizerApplicationDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Telegram должен быть строкой' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100, { message: 'Telegram не может быть длиннее 100 символов' }),
    __metadata("design:type", String)
], CreateOrganizerApplicationDto.prototype, "telegram", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Опыт должен быть строкой' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOrganizerApplicationDto.prototype, "experience", void 0);
//# sourceMappingURL=create-organizer-application.dto.js.map