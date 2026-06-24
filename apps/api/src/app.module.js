"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const engine_module_1 = require("./engine/engine.module");
const auth_module_1 = require("./modules/auth/auth.module");
const games_module_1 = require("./modules/games/games.module");
const sessions_module_1 = require("./modules/sessions/sessions.module");
const scenarios_module_1 = require("./modules/scenarios/scenarios.module");
const users_module_1 = require("./modules/users/users.module");
const organizer_module_1 = require("./modules/organizer/organizer.module");
const teams_module_1 = require("./modules/teams/teams.module");
const admin_module_1 = require("./modules/admin/admin.module");
const upload_module_1 = require("./modules/upload/upload.module");
const prisma_module_1 = require("./common/prisma/prisma.module");
const configuration_1 = require("./config/configuration");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.appConfig, configuration_1.databaseConfig, configuration_1.redisConfig, configuration_1.jwtConfig],
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    throttlers: [
                        {
                            ttl: 60000, // 1 minute
                            limit: config.get('RATE_LIMIT_MAX') || 100, // 100 requests per minute
                        },
                    ],
                }),
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            games_module_1.GamesModule,
            sessions_module_1.SessionsModule,
            scenarios_module_1.ScenariosModule,
            users_module_1.UsersModule,
            organizer_module_1.OrganizerModule,
            teams_module_1.TeamsModule,
            admin_module_1.AdminModule,
            upload_module_1.UploadModule,
            engine_module_1.EngineModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map