import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OrganizerController } from './organizer.controller';
import { OrganizerService } from './organizer.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
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
  controllers: [OrganizerController],
  providers: [OrganizerService],
  exports: [OrganizerService],
})
export class OrganizerModule {}
