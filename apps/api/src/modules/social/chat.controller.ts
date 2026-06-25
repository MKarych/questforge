// ============================================================
// Chat Controller
// Эндпоинты для личных сообщений (ЛС)
// ============================================================

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SocialService } from './social.service';
import {
  ChatPreviewDto,
  ChatMessageDto,
  SendMessageDto,
} from './dto/social.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly socialService: SocialService) {}

  /**
   * Отправить личное сообщение
   * POST /users/:id/chat
   */
  @Post(':id/chat')
  async sendMessage(
    @Req() req: any,
    @Param('id') receiverId: string,
    @Body() dto: SendMessageDto,
  ): Promise<ChatMessageDto> {
    return this.socialService.sendMessage(req.user.uuid, receiverId, dto);
  }

  /**
   * Получить список чатов (превью)
   * GET /users/me/chats
   */
  @Get('me/chats')
  async getMyChats(@Req() req: any): Promise<ChatPreviewDto[]> {
    return this.socialService.getChats(req.user.uuid);
  }

  /**
   * Получить историю переписки с пользователем
   * GET /users/:id/chat
   */
  @Get(':id/chat')
  async getChatHistory(
    @Req() req: any,
    @Param('id') otherUserId: string,
  ): Promise<ChatMessageDto[]> {
    return this.socialService.getChatHistory(req.user.uuid, otherUserId);
  }
}