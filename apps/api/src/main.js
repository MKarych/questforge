"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const path_1 = require("path");
const figlet = __importStar(require("figlet"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT') || 3000;
    // Serve static files from public/ directory
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'public'), {
        prefix: '/',
    });
    // Serve uploaded files with cache control for avatars
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'public', 'uploads'), {
        prefix: '/uploads',
        setHeaders: (res) => {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        },
    });
    // Global validation pipe
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        stopAtFirstError: true,
    }));
    // Global exception filter
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    // Global interceptors
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    // CORS
    app.enableCors({
        origin: configService.get('CORS_ORIGIN') || 'http://localhost:3001',
        credentials: true,
    });
    // Prefix
    app.setGlobalPrefix('api');
    await app.listen(port);
    console.log('\n' + figlet.textSync('ADVENTURE ENGINE', {
        font: 'Slant',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    }));
    console.log(`🏙️  Город Приключений — Adventure Engine`);
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
}
bootstrap();
//# sourceMappingURL=main.js.map