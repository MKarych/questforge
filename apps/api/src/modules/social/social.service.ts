import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DomainEventBus, UserDomainEventType } from '../users/domain/user-domain-events';
import {
  FriendDto,
  FriendRequestDto,
  BlockedUserDto,
  SendFriendRequestDto,
  RespondFriendRequestDto,
  BlockUserDto,
  ChatPreviewDto,
  ChatMessageDto,
  SendMessageDto,
} from './dto/social.dto';

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // FRIEND REQUESTS
  // ============================================================

  async sendFriendRequest(
    fromUserId: string,
    toUserId: string,
    dto: SendFriendRequestDto,
  ): Promise<FriendRequestDto> {
    if (fromUserId === toUserId) {
      throw new BadRequestException('Нельзя отправить заявку самому себе');
    }

    // Проверка существования пользователя
    const targetUser = await this.prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true, username: true, slug: true, profile: true },
    });
    if (!targetUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверка блокировки
    const isBlocked = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { userId: fromUserId, blockedId: toUserId },
          { userId: toUserId, blockedId: fromUserId },
        ],
      },
    });
    if (isBlocked) {
      throw new ForbiddenException('Невозможно отправить заявку — пользователь заблокирован');
    }

    // Проверка, что уже друзья
    const alreadyFriends = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userId: fromUserId, friendId: toUserId },
          { userId: toUserId, friendId: fromUserId },
        ],
      },
    });
    if (alreadyFriends) {
      throw new ConflictException('Вы уже друзья');
    }

    // Проверка существующей заявки
    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
        status: 'PENDING',
      },
    });
    if (existingRequest) {
      throw new ConflictException('Заявка уже существует');
    }

    const request = await this.prisma.friendRequest.create({
      data: {
        fromUserId,
        toUserId,
        message: dto.message || null,
        status: 'PENDING',
      },
      include: {
        fromUser: { select: { id: true, username: true, slug: true, profile: true } },
        toUser: { select: { id: true, username: true, slug: true, profile: true } },
      },
    });

    // Публикация события
    await DomainEventBus.getInstance().publish(
      DomainEventBus.create(UserDomainEventType.FriendRequestSent, fromUserId, {
        toUserId,
        requestId: request.id,
      }),
    );

    return this.mapFriendRequest(request);
  }

  async respondToFriendRequest(
      userId: string,
      requestId: string,
      dto: RespondFriendRequestDto,
    ): Promise<FriendRequestDto> {
      const request = await this.prisma.friendRequest.findUnique({
        where: { id: requestId },
        include: {
          fromUser: { select: { id: true, username: true, slug: true, profile: true } },
          toUser: { select: { id: true, username: true, slug: true, profile: true } },
        },
      });

      if (!request) {
        throw new NotFoundException('Заявка не найдена');
      }

      if (request.toUserId !== userId) {
        throw new ForbiddenException('Вы не можете ответить на эту заявку');
      }

      if (request.status !== 'PENDING') {
        throw new BadRequestException('Заявка уже обработана');
      }

      if (dto.action === 'ACCEPT') {
        const updated = await this.prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' },
          include: {
            fromUser: { select: { id: true, username: true, slug: true, profile: true } },
            toUser: { select: { id: true, username: true, slug: true, profile: true } },
          },
        });

        // Создаём двустороннюю дружбу
        await this.prisma.friend.createMany({
          data: [
            { userId: request.fromUserId, friendId: request.toUserId },
            { userId: request.toUserId, friendId: request.fromUserId },
          ],
        });

        await DomainEventBus.getInstance().publish(
          DomainEventBus.create(UserDomainEventType.FriendRequestAccepted, userId, {
            friendId: request.fromUserId,
            requestId: request.id,
          }),
        );

        return this.mapFriendRequest(updated);
      } else {
        const updated = await this.prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'REJECTED' },
          include: {
            fromUser: { select: { id: true, username: true, slug: true, profile: true } },
            toUser: { select: { id: true, username: true, slug: true, profile: true } },
          },
        });

        await DomainEventBus.getInstance().publish(
          DomainEventBus.create(UserDomainEventType.FriendRequestRejected, userId, {
            friendId: request.fromUserId,
            requestId: request.id,
          }),
        );

        return this.mapFriendRequest(updated);
      }
    }

  async cancelFriendRequest(userId: string, requestId: string): Promise<void> {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (request.fromUserId !== userId) {
      throw new ForbiddenException('Вы не можете отменить эту заявку');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Заявка уже обработана');
    }

    await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });
  }

  async getFriendRequests(userId: string): Promise<{ incoming: FriendRequestDto[]; outgoing: FriendRequestDto[] }> {
    const [incoming, outgoing] = await Promise.all([
      this.prisma.friendRequest.findMany({
        where: { toUserId: userId, status: 'PENDING' },
        include: {
          fromUser: { select: { id: true, username: true, slug: true, profile: true } },
          toUser: { select: { id: true, username: true, slug: true, profile: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.friendRequest.findMany({
        where: { fromUserId: userId },
        include: {
          fromUser: { select: { id: true, username: true, slug: true, profile: true } },
          toUser: { select: { id: true, username: true, slug: true, profile: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      incoming: incoming.map((r) => this.mapFriendRequest(r)),
      outgoing: outgoing.map((r) => this.mapFriendRequest(r)),
    };
  }

  // ============================================================
  // FRIENDS
  // ============================================================

  async getFriends(userId: string): Promise<FriendDto[]> {
    const friends = await this.prisma.friend.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            slug: true,
            profile: true,
            bio: true,
          },
        },
      },
      orderBy: { lastInteraction: 'desc' },
    });

    return friends.map((f) => ({
      id: f.id,
      userId: f.friend.id,
      username: f.friend.username,
      slug: f.friend.slug,
      avatar: this.getAvatarFromProfile(f.friend.profile),
      bio: f.friend.bio || '',
      addedAt: f.addedAt,
      lastInteraction: f.lastInteraction,
    }));
  }

  async getPublicFriends(userId: string): Promise<FriendDto[]> {
    return this.getFriends(userId);
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    if (userId === friendId) {
      throw new BadRequestException('Нельзя удалить самого себя');
    }

    const friendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (!friendship) {
      throw new NotFoundException('Друг не найден');
    }

    // Удаляем обе записи дружбы
    await this.prisma.friend.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    await DomainEventBus.getInstance().publish(
      DomainEventBus.create(UserDomainEventType.FriendRemoved, userId, { friendId }),
    );
  }

  // ============================================================
  // BLOCK
  // ============================================================

  async blockUser(userId: string, blockedId: string, dto: BlockUserDto): Promise<BlockedUserDto> {
    if (userId === blockedId) {
      throw new BadRequestException('Нельзя заблокировать самого себя');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: blockedId },
      select: { id: true, username: true, slug: true, profile: true },
    });
    if (!targetUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    const existing = await this.prisma.blockedUser.findUnique({
      where: { userId_blockedId: { userId, blockedId } },
    });
    if (existing) {
      throw new ConflictException('Пользователь уже заблокирован');
    }

    // При блокировке удаляем дружбу
    await this.prisma.friend.deleteMany({
      where: {
        OR: [
          { userId, friendId: blockedId },
          { userId: blockedId, friendId: userId },
        ],
      },
    });

    // Отменяем заявки
    await this.prisma.friendRequest.updateMany({
      where: {
        OR: [
          { fromUserId: userId, toUserId: blockedId },
          { fromUserId: blockedId, toUserId: userId },
        ],
        status: 'PENDING',
      },
      data: { status: 'CANCELLED' },
    });

    const block = await this.prisma.blockedUser.create({
      data: {
        userId,
        blockedId,
        reason: dto.reason || null,
      },
      include: {
        blocked: {
          select: { id: true, username: true, slug: true, profile: true },
        },
      },
    });

    await DomainEventBus.getInstance().publish(
      DomainEventBus.create(UserDomainEventType.UserBlocked, userId, { blockedId }),
    );

    return {
      id: block.id,
      blockedId: block.blocked.id,
      username: block.blocked.username,
      slug: block.blocked.slug,
      avatar: this.getAvatarFromProfile(block.blocked.profile),
      reason: block.reason || undefined,
      createdAt: block.createdAt,
    };
  }

  async unblockUser(userId: string, blockedId: string): Promise<void> {
    const block = await this.prisma.blockedUser.findUnique({
      where: { userId_blockedId: { userId, blockedId } },
    });

    if (!block) {
      throw new NotFoundException('Пользователь не в чёрном списке');
    }

    await this.prisma.blockedUser.delete({
      where: { id: block.id },
    });

    await DomainEventBus.getInstance().publish(
      DomainEventBus.create(UserDomainEventType.UserUnblocked, userId, { blockedId }),
    );
  }

  async getBlockedUsers(userId: string): Promise<BlockedUserDto[]> {
    const blocked = await this.prisma.blockedUser.findMany({
      where: { userId },
      include: {
        blocked: {
          select: { id: true, username: true, slug: true, profile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return blocked.map((b) => ({
      id: b.id,
      blockedId: b.blocked.id,
      username: b.blocked.username,
      slug: b.blocked.slug,
      avatar: this.getAvatarFromProfile(b.blocked.profile),
      reason: b.reason || undefined,
      createdAt: b.createdAt,
    }));
  }

  // ============================================================
  // HELPERS
  // ============================================================

  async getFriendsCount(userId: string): Promise<number> {
    return this.prisma.friend.count({ where: { userId } });
  }

  async isFriend(userId: string, targetUserId: string): Promise<boolean> {
    const friend = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userId, friendId: targetUserId },
          { userId: targetUserId, friendId: userId },
        ],
      },
    });
    return !!friend;
  }

  async hasPendingRequest(userId: string, targetUserId: string): Promise<boolean> {
    const request = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { fromUserId: userId, toUserId: targetUserId },
          { fromUserId: targetUserId, toUserId: userId },
        ],
        status: 'PENDING',
      },
    });
    return !!request;
  }

  async isBlocked(userId: string, targetUserId: string): Promise<boolean> {
    const block = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { userId, blockedId: targetUserId },
          { userId: targetUserId, blockedId: userId },
        ],
      },
    });
    return !!block;
  }

  async canSendMessage(senderId: string, receiverId: string): Promise<boolean> {
    // Проверка блокировки
    const blocked = await this.isBlocked(senderId, receiverId);
    if (blocked) return false;

    // Друзья могут писать
    const friends = await this.isFriend(senderId, receiverId);
    if (friends) return true;

    // Исключение: организатору можно написать, если играли вместе
    const playedTogether = await this.prisma.gameRegistration.findFirst({
      where: {
        team: {
          members: { some: { userId: senderId } },
        },
        game: {
          organizerId: receiverId,
        },
      },
    });
    if (playedTogether) return true;

    return false;
  }

  private getAvatarFromProfile(profile: unknown): string | null {
    if (!profile || typeof profile !== 'object') return null;
    const p = profile as Record<string, unknown>;
    return (p['avatar'] as string) || null;
  }

  private mapFriendRequest(request: {
    id: string;
    fromUserId: string;
    toUserId: string;
    status: string;
    message: string | null;
    createdAt: Date;
    updatedAt: Date;
    fromUser: { id: string; username: string; slug: string; profile: unknown };
    toUser: { id: string; username: string; slug: string; profile: unknown };
  }): FriendRequestDto {
    return {
      id: request.id,
      fromUserId: request.fromUserId,
      fromUser: {
        username: request.fromUser.username,
        slug: request.fromUser.slug,
        avatar: this.getAvatarFromProfile(request.fromUser.profile),
      },
      toUserId: request.toUserId,
      toUser: {
        username: request.toUser.username,
        slug: request.toUser.slug,
        avatar: this.getAvatarFromProfile(request.toUser.profile),
      },
      status: request.status as FriendRequestDto['status'],
      message: request.message || undefined,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  // ============================================================
  // CHATS (личные сообщения)
  // ============================================================

  async sendMessage(
    senderId: string,
    receiverId: string,
    dto: SendMessageDto,
  ): Promise<ChatMessageDto> {
    if (senderId === receiverId) {
      throw new BadRequestException('Нельзя отправить сообщение самому себе');
    }

    // Проверка права на отправку
    const canSend = await this.canSendMessage(senderId, receiverId);
    if (!canSend) {
      throw new ForbiddenException('Невозможно отправить сообщение этому пользователю');
    }

    // Найти существующий чат или создать новый
    let chat = await this.prisma.chat.findFirst({
      where: {
        OR: [
          { user1Id: senderId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: senderId },
        ],
      },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: {
          user1Id: senderId,
          user2Id: receiverId,
        },
      });
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        senderId,
        text: dto.text,
      },
    });

    // Обновляем lastInteraction у друзей (если они друзья)
    await this.prisma.friend.updateMany({
      where: {
        OR: [
          { userId: senderId, friendId: receiverId },
          { userId: receiverId, friendId: senderId },
        ],
      },
      data: { lastInteraction: new Date() },
    });

    return {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      text: message.text,
      readAt: message.readAt,
      createdAt: message.createdAt,
    };
  }

  async getChats(userId: string): Promise<ChatPreviewDto[]> {
    const chats = await this.prisma.chat.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      include: {
        user1: { select: { id: true, username: true, slug: true, profile: true } },
        user2: { select: { id: true, username: true, slug: true, profile: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return chats.map((chat) => {
      const otherUser = chat.user1Id === userId ? chat.user2 : chat.user1;
      const lastMessage = chat.messages[0] || null;

      return {
        chatId: chat.id,
        withUserId: otherUser.id,
        withUser: {
          username: otherUser.username,
          slug: otherUser.slug,
          avatar: this.getAvatarFromProfile(otherUser.profile),
        },
        lastMessage: lastMessage?.text || null,
        lastMessageAt: lastMessage?.createdAt || null,
        unreadCount: 0, // TODO: реализовать подсчёт непрочитанных
        createdAt: chat.createdAt,
      };
    });
  }

  async getChatHistory(userId: string, otherUserId: string): Promise<ChatMessageDto[]> {
    const chat = await this.prisma.chat.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: otherUserId },
          { user1Id: otherUserId, user2Id: userId },
        ],
      },
    });

    if (!chat) {
      return [];
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((msg) => ({
      id: msg.id,
      chatId: msg.chatId,
      senderId: msg.senderId,
      text: msg.text,
      readAt: msg.readAt,
      createdAt: msg.createdAt,
    }));
  }
}