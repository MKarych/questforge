# Social Module: Друзья, Чаты, Блокировка

> **Дата:** 27.06.2026  
> **Статус:** Актуален  
> **Версия:** 1.0  
> **Цель:** Описать социальный слой платформы — друзья, заявки, личные сообщения, блокировка.

---

## 1. Обзор

Social Module обеспечивает взаимодействие пользователей между собой вне игрового процесса:

- **Друзья** — двусторонние связи между пользователями
- **Friend Requests** — заявки в друзья (PENDING → ACCEPTED/REJECTED/CANCELLED)
- **Chats** — личные сообщения между двумя пользователями
- **Blocked Users** — чёрный список пользователей
- **Follow System** — подписки на пользователей (для ленты активности)

---

## 2. Модели данных (Prisma)

### 2.1. Friend

Двунаправленная связь между двумя пользователями.

```prisma
model Friend {
  id            String   @id @default(uuid())
  userId        String   @map("user_id") @db.Uuid
  friendId      String   @map("friend_id") @db.Uuid
  addedAt       DateTime @default(now()) @map("added_at")
  lastInteraction DateTime @default(now()) @map("last_interaction")

  user    User @relation("FriendSource", fields: [userId], references: [id], onDelete: Cascade)
  friend  User @relation("FriendTarget", fields: [friendId], references: [id], onDelete: Cascade)

  @@unique([userId, friendId])
  @@index([userId])
  @@index([friendId])
  @@map("friends")
}
```

**Правила:**
- Дружба двусторонняя: A → B создаёт запись (A, B) и (B, A)
- При удалении пользователя все его дружеские связи удаляются (Cascade)
- `lastInteraction` обновляется при каждом сообщении

---

### 2.2. FriendRequest

Заявки в друзья с жизненным циклом.

```prisma
enum FriendRequestStatus {
  PENDING
  ACCEPTED
  REJECTED
  CANCELLED
}

model FriendRequest {
  id         String              @id @default(uuid())
  fromUserId String              @map("from_user_id") @db.Uuid
  toUserId   String              @map("to_user_id") @db.Uuid
  status     FriendRequestStatus @default(PENDING)
  message    String?             @db.Text
  createdAt  DateTime            @default(now()) @map("created_at")
  updatedAt  DateTime            @updatedAt @map("updated_at")

  fromUser User @relation("FriendRequestSender", fields: [fromUserId], references: [id], onDelete: Cascade)
  toUser   User @relation("FriendRequestReceiver", fields: [toUserId], references: [id], onDelete: Cascade)

  @@unique([fromUserId, toUserId])
  @@index([fromUserId])
  @@index([toUserId])
  @@index([status])
  @@map("friend_requests")
}
```

**Жизненный цикл:**
```
PENDING (создана)
  ├─→ ACCEPTED (принята → создаётся Friend)
  ├─→ REJECTED (отклонена)
  └─→ CANCELLED (отменена отправителем)
```

**Правила:**
- Одновременно может быть только одна заявка от A к B (уникальность по паре)
- Нельзя отправить заявку себе
- Заблокированный пользователь не может отправить заявку
- При ACCEPTED создаются записи дружбы в обоих направлениях

---

### 2.3. BlockedUser

Чёрный список.

```prisma
model BlockedUser {
  id        String   @id @default(uuid())
  userId    String   @map("user_id") @db.Uuid
  blockedId String   @map("blocked_id") @db.Uuid
  reason    String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at")

  user     User @relation("BlockedUserSource", fields: [userId], references: [id], onDelete: Cascade)
  blocked  User @relation("BlockedUserTarget", fields: [blockedId], references: [id], onDelete: Cascade)

  @@unique([userId, blockedId])
  @@index([userId])
  @@index([blockedId])
  @@map("blocked_users")
}
```

**Правила:**
- Блокировка однонаправленная: A блокирует B ≠ B блокирует A
- Заблокированный пользователь:
  - Не может отправить заявку в друзья
  - Не может отправить личное сообщение
  - Не виден в поиске (опционально)
- При разблокировке запись удаляется

---

### 2.4. Chat

Личный чат между двумя пользователями (один чат на пару).

```prisma
model Chat {
  id          String       @id @default(uuid())
  user1Id     String       @map("user1_id") @db.Uuid
  user2Id     String       @map("user2_id") @db.Uuid
  lastMessage String?      @db.Text
  lastMessageAt DateTime?  @map("last_message_at")
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  user1    User         @relation("ChatUser1", fields: [user1Id], references: [id], onDelete: Cascade)
  user2    User         @Relation("ChatUser2", fields: [user2Id], references: [id], onDelete: Cascade)
  messages ChatMessage[]

  @@unique([user1Id, user2Id])
  @@index([user1Id])
  @@index([user2Id])
  @@index([lastMessageAt])
  @@map("chats")
}
```

**Правила:**
- Один чат на пару пользователей (уникальность по паре)
- Порядок user1/user2 определяется меньшим ID (для консистентности)
- `lastMessage` и `lastMessageAt` обновляются при каждом новом сообщении

---

### 2.5. ChatMessage

Сообщения в чате.

```prisma
model ChatMessage {
  id        String   @id @default(uuid())
  chatId    String   @map("chat_id") @db.Uuid
  senderId  String   @map("sender_id") @db.Uuid
  text      String   @db.Text
  readAt    DateTime? @map("read_at")
  createdAt DateTime @default(now()) @map("created_at")

  chat   Chat @Relation(fields: [chatId], references: [id], onDelete: Cascade)
  sender User @Relation(fields: [senderId], references: [id])

  @@index([chatId])
  @@index([chatId, createdAt])
  @@index([senderId])
  @@map("chat_messages")
}
```

**Правила:**
- Сообщения видны только участникам чата
- `readAt` — когда получатель прочитал сообщение (для WebSocket-подписки)
- При удалении чата все сообщения удаляются (Cascade)

---

### 2.6. Follow

Система подписок (односторонняя связь).

```prisma
model Follow {
  id          String   @id @default(uuid())
  followerId  String   @map("follower_id") @db.Uuid
  followingId String   @map("following_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  follower    User     @Relation("FollowSource", fields: [followerId], references: [id], onDelete: Cascade)
  following   User     @Relation("FollowTarget", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
```

**Правила:**
- Подписка односторонняя: A подписан на B ≠ B подписан на A
- Можно подписаться только на живого пользователя (deletedAt IS NULL)
- Нельзя подписаться на себя

---

## 3. API Эндпоинты

### 3.1. Друзья

```
GET    /social/friends              — Мои друзья
GET    /social/friends/:userId      — Друзья конкретного пользователя (публично)
POST   /social/friends/:userId      — Добавить в друзья (отправить заявку)
DELETE /social/friends/:userId      — Удалить из друзей
```

### 3.2. Заявки в друзья

```
GET    /social/friend-requests      — Мои заявки (входящие + исходящие)
POST   /social/friend-requests/:id/accept  — Принять заявку
POST   /social/friend-requests/:id/reject  — Отклонить заявку
POST   /social/friend-requests/:id/cancel  — Отменить исходящую заявку
```

### 3.3. Чаты

```
GET    /social/chats                — Список моих чатов
GET    /social/chats/:userId        — История чата с пользователем
POST   /social/chats/:userId/message — Отправить сообщение
```

### 3.4. Блокировка

```
POST   /social/block/:userId        — Заблокировать пользователя
DELETE /social/block/:userId        — Разблокировать пользователя
GET    /social/blocked              — Список заблокированных
```

### 3.5. Подписки

```
POST   /social/follow/:userId       — Подписаться
DELETE /social/follow/:userId       — Отписаться
GET    /social/followers/:userId    — Подписчики пользователя
GET    /social/following/:userId    — Кто подписан на пользователя
```

---

## 4. WebSocket события

Социальный модуль использует WebSocket для real-time уведомлений:

```typescript
// Входящие события (клиент → сервер)
{ type: 'chat_message', chatId: string, text: string }
{ type: 'typing', chatId: string, isTyping: boolean }

// Исходящие события (сервер → клиент)
{ type: 'new_message', chatId: string, message: ChatMessage }
{ type: 'friend_request', fromUserId: string, message?: string }
{ type: 'friend_accepted', fromUserId: string }
{ type: 'user_blocked', blockedId: string }
{ type: 'typing_indicator', chatId: string, userId: string, isTyping: boolean }
```

---

## 5. Domain Events

```typescript
enum SocialDomainEvent {
  FriendAdded       = 'friend.added',
  FriendRemoved     = 'friend.removed',
  FriendRequestSent = 'friend.request.sent',
  FriendRequestAccepted = 'friend.request.accepted',
  FriendRequestRejected = 'friend.request.rejected',
  FriendRequestCancelled = 'friend.request.cancelled',
  UserBlocked       = 'user.blocked',
  UserUnblocked     = 'user.unblocked',
  ChatMessageSent   = 'chat.message.sent',
  ChatCreated       = 'chat.created',
  FollowCreated     = 'follow.created',
  FollowRemoved     = 'follow.removed',
}
```

---

## 6. Фронтенд

### 6.1. Страницы

| Страница | Путь | Описание |
|----------|------|----------|
| Друзья | `/profile/friends` | Список друзей, заявки |
| Чаты | `/profile/chats` | Список чатов, переписка |
| Профиль | `/profile/:id` | Публичный профиль с кнопками "Добавить в друзья"/"Подписаться" |

### 6.2. Компоненты

- `FriendList` — список друзей с поиском
- `FriendRequestCard` — карточка заявки (принять/отклонить)
- `ChatWindow` — окно чата с сообщениями
- `MessageInput` — поле ввода сообщения
- `UserBlocker` — компонент блокировки
- `FollowButton` — кнопка подписки

---

## 7. Архитектурные правила

1. **Chat — один на пару.** Один чат создаётся на пару пользователей и复用ается.
2. **Friendship — двусторонняя.** При принятии заявки создаются две записи.
3. **Block — однонаправленная.** Блокировка не взаимна.
4. **Follow — односторонняя.** Подписка не взаимна.
5. **Заблокированный пользователь ограничен:**
   - Не может отправить заявку в друзья
   - Не может отправить сообщение
   - Не может быть добавлен в команду
6. **Все действия логируются** в AuditLog.
7. **Real-time через WebSocket** для сообщений и уведомлений.

---

**Дата:** 27.06.2026  
**Статус:** Актуален  
**Версия:** 1.0
