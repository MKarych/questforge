// ============================================================
// Social Controller
// Эндпоинты для управления друзьями, заявками и блокировками
// ============================================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SocialService } from './social.service';
import {
  FriendDto,
  FriendRequestDto,
  BlockedUserDto,
  SendFriendRequestDto,
  RespondFriendRequestDto,
  BlockUserDto,
} from './dto/social.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ============================================================
  // FRIEND REQUESTS
  // ============================================================

  /**
   * Отправить заявку в друзья
   * POST /users/:id/friend-request
   */
  @Post(':id/friend-request')
  async sendFriendRequest(
    @Req() req: any,
    @Param('id') toUserId: string,
    @Body() dto: SendFriendRequestDto,
  ): Promise<FriendRequestDto> {
    return this.socialService.sendFriendRequest(req.user.uuid, toUserId, dto);
  }

  /**
   * Ответить на заявку (принять/отклонить)
   * PATCH /users/friend-requests/:id
   */
  @Patch('friend-requests/:id')
  async respondToFriendRequest(
    @Req() req: any,
    @Param('id') requestId: string,
    @Body() dto: RespondFriendRequestDto,
  ): Promise<FriendRequestDto> {
    return this.socialService.respondToFriendRequest(req.user.uuid, requestId, dto);
  }

  /**
   * Отменить свою заявку
   * DELETE /users/friend-requests/:id
   */
  @Delete('friend-requests/:id')
  async cancelFriendRequest(
    @Req() req: any,
    @Param('id') requestId: string,
  ): Promise<void> {
    return this.socialService.cancelFriendRequest(req.user.uuid, requestId);
  }

  /**
   * Получить мои заявки (входящие и исходящие)
   * GET /users/me/friend-requests
   */
  @Get('me/friend-requests')
  async getMyFriendRequests(
    @Req() req: any,
  ): Promise<{ incoming: FriendRequestDto[]; outgoing: FriendRequestDto[] }> {
    return this.socialService.getFriendRequests(req.user.uuid);
  }

  // ============================================================
  // FRIENDS
  // ============================================================

  /**
   * Мой список друзей
   * GET /users/me/friends
   */
  @Get('me/friends')
  async getMyFriends(@Req() req: any): Promise<FriendDto[]> {
    return this.socialService.getFriends(req.user.uuid);
  }

  /**
   * Публичный список друзей пользователя
   * GET /users/:id/friends
   */
  @Get(':id/friends')
  async getPublicFriends(@Param('id') userId: string): Promise<FriendDto[]> {
    return this.socialService.getPublicFriends(userId);
  }

  /**
   * Удалить из друзей
   * DELETE /users/:id/friend
   */
  @Delete(':id/friend')
  async removeFriend(
    @Req() req: any,
    @Param('id') friendId: string,
  ): Promise<void> {
    return this.socialService.removeFriend(req.user.uuid, friendId);
  }

  // ============================================================
  // BLOCK
  // ============================================================

  /**
   * Заблокировать пользователя
   * POST /users/:id/block
   */
  @Post(':id/block')
  async blockUser(
    @Req() req: any,
    @Param('id') blockedId: string,
    @Body() dto: BlockUserDto,
  ): Promise<BlockedUserDto> {
    return this.socialService.blockUser(req.user.uuid, blockedId, dto);
  }

  /**
   * Разблокировать пользователя
   * DELETE /users/:id/block
   */
  @Delete(':id/block')
  async unblockUser(
    @Req() req: any,
    @Param('id') blockedId: string,
  ): Promise<void> {
    return this.socialService.unblockUser(req.user.uuid, blockedId);
  }

  /**
   * Мой чёрный список
   * GET /users/me/blocked
   */
  @Get('me/blocked')
  async getMyBlockedUsers(@Req() req: any): Promise<BlockedUserDto[]> {
    return this.socialService.getBlockedUsers(req.user.uuid);
  }
}