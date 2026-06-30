import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { ChatService } from './chat.service';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          audience: configService.get('jwt.audience'),
          issuer: configService.get('jwt.issuer'),
          expiresIn: configService.get('jwt.accessTokenTtl'),
        },
      }),
      inject: [ConfigService],
    }),
    ActivityModule,
  ],
  controllers: [GamesController],
  providers: [GamesService, ChatService],
  exports: [GamesService, ChatService],
})
export class GamesModule {}
