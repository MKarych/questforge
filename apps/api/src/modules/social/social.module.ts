// ============================================================
// Social Module
// Управление друзьями, заявками, блокировками и ЛС
// ============================================================

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { ChatController } from './chat.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SocialController, ChatController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}