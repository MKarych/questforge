import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

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
  ],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
