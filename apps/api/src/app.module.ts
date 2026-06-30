import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EngineModule } from './engine/engine.module';
import { AuthModule } from './modules/auth/auth.module';
import { GamesModule } from './modules/games/games.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { ScenariosModule } from './modules/scenarios/scenarios.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizerModule } from './modules/organizer/organizer.module';
import { TeamsModule } from './modules/teams/teams.module';
import { AdminModule } from './modules/admin/admin.module';
import { UploadModule } from './modules/upload/upload.module';
import { HomeModule } from './modules/home/home.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { ActivityFeedModule } from './modules/activity-feed/activity-feed.module';
import { ActivityModule } from './modules/activity/activity.module';
import { BillingModule } from './modules/billing/billing.module';
import { SupportModule } from './modules/support/support.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { SearchModule } from './modules/search/search.module';
import { SocialModule } from './modules/social/social.module';
import { CommerceModule } from './modules/commerce/commerce.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { appConfig, databaseConfig, redisConfig, jwtConfig } from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: 60000, // 1 minute
            limit: config.get<number>('RATE_LIMIT_MAX') || 100, // 100 requests per minute
          },
        ],
      }),
    }),
    PrismaModule,
    AuthModule,
    GamesModule,
    SessionsModule,
    ScenariosModule,
    UsersModule,
    OrganizerModule,
    TeamsModule,
    AdminModule,
    UploadModule,
    HomeModule,
    NotificationsModule,
    AchievementsModule,
    ActivityFeedModule,
    ActivityModule,
    BillingModule,
    SupportModule,
    RealtimeModule,
    SearchModule,
    SocialModule,
    CommerceModule,
    ComplaintsModule,
    EngineModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
