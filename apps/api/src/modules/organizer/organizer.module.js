"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizerModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const organizer_controller_1 = require("./organizer.controller");
const organizer_service_1 = require("./organizer.service");
const prisma_module_1 = require("../../common/prisma/prisma.module");
const config_1 = require("@nestjs/config");
let OrganizerModule = class OrganizerModule {
};
exports.OrganizerModule = OrganizerModule;
exports.OrganizerModule = OrganizerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    secret: configService.get('jwt.secret'),
                    signOptions: {
                        audience: configService.get('jwt.audience'),
                        issuer: configService.get('jwt.issuer'),
                        expiresIn: configService.get('jwt.accessTokenTtl'),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [organizer_controller_1.OrganizerController],
        providers: [organizer_service_1.OrganizerService],
        exports: [organizer_service_1.OrganizerService],
    })
], OrganizerModule);
//# sourceMappingURL=organizer.module.js.map