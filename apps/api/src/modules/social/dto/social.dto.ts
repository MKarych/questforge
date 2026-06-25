// ============================================================
// Social DTOs
// ============================================================

export interface FriendDto {
  id: string;
  userId: string;
  username: string;
  slug: string;
  avatar: string | null;
  bio: string;
  addedAt: Date;
  lastInteraction: Date;
}

export interface FriendRequestDto {
  id: string;
  fromUserId: string;
  fromUser: {
    username: string;
    slug: string;
    avatar: string | null;
  };
  toUserId: string;
  toUser: {
    username: string;
    slug: string;
    avatar: string | null;
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlockedUserDto {
  id: string;
  blockedId: string;
  username: string;
  slug: string;
  avatar: string | null;
  reason?: string;
  createdAt: Date;
}

export interface SendFriendRequestDto {
  message?: string;
}

export interface RespondFriendRequestDto {
  action: 'ACCEPT' | 'REJECT';
}

export interface BlockUserDto {
  reason?: string;
}

export interface ChatPreviewDto {
  chatId: string;
  withUserId: string;
  withUser: {
    username: string;
    slug: string;
    avatar: string | null;
  };
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  createdAt: Date;
}

export interface ChatMessageDto {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  readAt: Date | null;
  createdAt: Date;
}

export interface SendMessageDto {
  text: string;
}