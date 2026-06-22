import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from './common/prisma/prisma.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EngineModule } from './engine/engine.module';
import { AuthModule } from './modules/auth/auth.module';
import { GamesModule } from './modules/games/games.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { ScenariosModule } from './modules/scenarios/scenarios.module';
import { UsersModule } from './modules/users/users.module';
import { appConfig, databaseConfig, redisConfig, jwtConfig } from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig],
    }),
    AuthModule,
    GamesModule,
    SessionsModule,
    ScenariosModule,
    UsersModule,
    EngineModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
