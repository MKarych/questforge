# Отчёт по синхронизации фронтенда и бэкенда

> **Дата:** 27.06.2026
> **Аудитор:** AI-агент
> **Методология:** Сравнение API-контроллеров (`apps/api/src/modules/`), API-клиента (`apps/web/src/lib/api/client.ts`) и страниц (`apps/web/src/app/`)

---

## Общая статистика

| Показатель | Значение |
|------------|----------|
| Бэкенд-контроллеров | 15 |
| Фронтенд-страниц | 40+ |
| Методов в API-клиенте | ~120 |
| ✅ Полностью синхронизировано модулей | 6 |
| ⚠️ Частично синхронизировано | 5 |
| ❌ Бэк есть → фронта нет | 3 |
| ❌ Фронт есть → бэка нет | 2 |

---

## ✅ Полностью синхронизировано

### 1. Auth (регистрация, логин, профиль)

| Бэкенд-эндпоинт | API-клиент | Фронтенд-страница | Статус |
|-----------------|-----------|-------------------|--------|
| `POST /auth/register` | `apiClient.register()` | `/auth/register/page.tsx` | ✅ |
| `POST /auth/login` | `apiClient.login()` | `/auth/login/page.tsx` | ✅ |
| `POST /auth/logout` | `apiClient.logout()` | Header → UserMenu | ✅ |
| `GET /auth/me` | `apiClient.getProfile()` | `/profile/edit/page.tsx` | ✅ |
| `POST /auth/refresh` | — (встроен в request) | — | ✅ |
| `GET /auth/verify-email` | — | — | ⚠️ Нет UI для верификации |
| `POST /auth/forgot-password` | — | `/auth/forgot-password/page.tsx` | ✅ |

### 2. Games (публичный каталог)

| Бэкенд-эндпоинт | API-клиент | Фронтенд-страница | Статус |
|-----------------|-----------|-------------------|--------|
| `GET /games` (public) | `apiClient.getPublicGames()` | `/games/page.tsx` | ✅ |
| `GET /games/:id` (public) | `apiClient.getPublicGame()` | `/games/[id]/page.tsx` | ✅ |
| `GET /games/:id/comments` | `apiClient.getPublicComments()` | `/games/[id]/page.tsx` | ✅ |
| `POST /games/:id/comments` | `apiClient.addPublicComment()` | `/games/[id]/page.tsx` | ✅ |
| `PATCH /games/:id/comments/:cid` | `apiClient.updatePublicComment()` | `/games/[id]/page.tsx` | ✅ |
| `DELETE /games/:id/comments/:cid` | `apiClient.deletePublicComment()` | `/games/[id]/page.tsx` | ✅ |

### 3. Games (организатор)

| Бэкенд-эндпоинт | API-клиент | Фронтенд-страница | Статус |
|-----------------|-----------|-------------------|--------|
| `POST /games` | `apiClient.createGame()` | `/organizer/games/create/page.tsx` | ✅ |
| `GET /games/me` | `apiClient.getMyGames()` | `/organizer/games/page.tsx` | ✅ |
| `GET /games/:id` | `apiClient.getGame()` | `/organizer/games/[id]/page.tsx` | ✅ |
| `PATCH /games/:id` | `apiClient.updateGame()` | `/organizer/games/[id]/edit/page.tsx` | ✅ |
| `DELETE /games/:id` | `apiClient.removeGame()` | `/organizer/games/page.tsx` | ✅ |
| `POST /games/:id/publish` | `apiClient.publishGame()` | `/organizer/games/[id]/page.tsx` | ✅ |
| `POST /games/:id/start` | `apiClient.startGame()` | `/organizer/games/[id]/page.tsx` | ✅ |
| `POST /games/:id/register` | `apiClient.registerTeam()` | `/organizer/games/[id]/page.tsx` | ✅ |
| `POST /games/:id/reviews` | `apiClient.addReview()` | `/games/[id]/page.tsx` | ✅ |
| `GET /games/:id/reviews` | `apiClient.getGameReviews()` | `/games/[id]/page.tsx` | ✅ |
| `GET /games/:id/teams-status` | `apiClient.getGameRegistrations()` | `/organizer/games/[id]/page.tsx` | ✅ |

### 4. Teams

| Бэкенд-эндпоинт | API-клиент | Фронтенд-страница | Статус |
|-----------------|-----------|-------------------|--------|
| `POST /teams` | `apiClient.createTeam()` | `/teams/create/page.tsx` | ✅ |
| `GET /teams` | `apiClient.getTeams()` | `/teams/page.tsx` | ✅ |
| `GET /teams/:id` | `apiClient.getTeam()` | `/teams/[id]/page.tsx` | ✅ |
| `GET /teams/:id/private` | `apiClient.getTeamPrivate()` | `/teams/[id]/page.tsx` | ✅ |
| `PATCH /teams/:id` | `apiClient.updateTeam()` | `/teams/[id]/page.tsx` | ✅ |
| `DELETE /teams/:id` | `apiClient.deleteTeam()` | `/teams/[id]/page.tsx` | ✅ |
| `GET /teams/:id/members` | `apiClient.getTeamMembers()` | `/teams/[id]/page.tsx` | ✅ |
| `PATCH /teams/:id/members/:uid` | `apiClient.updateMemberRole()` | `/teams/[id]/page.tsx` | ✅ |
| `DELETE /teams/:id/members/:uid` | `apiClient.removeMember()` | `/teams/[id]/page.tsx` | ✅ |
| `POST /teams/:id/invite` | `apiClient.inviteToTeam()` | `/teams/[id]/page.tsx` (InviteModal) | ✅ |
| `POST /teams/:id/invite/:iid/accept` | `apiClient.acceptInvite()` | `/teams/[id]/page.tsx` | ✅ |
| `POST /teams/:id/invite/:iid/decline` | `apiClient.declineInvite()` | `/teams/[id]/page.tsx` | ✅ |
| `POST /teams/:id/join` | `apiClient.createJoinRequest()` | `/teams/[id]/page.tsx` (JoinRequestModal) | ✅ |
| `POST /teams/:id/join/:rid/approve` | `apiClient.approveJoinRequest()` | `/teams/[id]/page.tsx` | ✅ |
| `POST /teams/:id/join/:rid/reject` | `apiClient.rejectJoinRequest()` | `/teams/[id]/page.tsx` | ✅ |
| `POST /teams/:id/leave` | `apiClient.leaveTeam()` | `/teams/[id]/page.tsx` | ✅ |
| `POST /teams/:id/transfer` | `apiClient.transferOwnership()` | `/teams/[id]/page.tsx` | ✅ |
| `POST /teams/:id/transfer/accept` | `apiClient.acceptTransfer()` | `/teams/[id]/page.tsx` | ✅ |
| `GET /teams/:id/history` | `apiClient.getTeamHistory()` | `/teams/[id]/page.tsx` | ✅ |
| `GET /teams/me/team` | `apiClient.getMyTeam()` | Header → UserMenu | ✅ |
| `GET /teams/my` | `apiClient.getMyTeams()` | `/teams/page.tsx` | ✅ |

### 5. Scenarios

| Бэкенд-эндпоинт | API-клиент | Фронтенд-страница | Статус |
|-----------------|-----------|-------------------|--------|
| `POST /scenarios` | `apiClient.createScenario()` | `/organizer/scenarios/create/page.tsx` | ✅ |
| `GET /scenarios` | `apiClient.getScenarios()` | `/organizer/scenarios/page.tsx` | ✅ |
| `GET /scenarios/:id` | `apiClient.getScenario()` | `/organizer/scenarios/[id]/edit/page.tsx` | ✅ |
| `PATCH /scenarios/:id` | `apiClient.updateScenario()` | `/organizer/scenarios/[id]/edit/page.tsx` | ✅ |
| `DELETE /scenarios/:id` | `apiClient.deleteScenario()` | `/organizer/scenarios/page.tsx` | ✅ |
| `POST /scenarios/:id/publish` | `apiClient.publishScenario()` | `/organizer/scenarios/[id]/edit/page.tsx` | ✅ |

### 6. Sessions

| Бэкенд-эндпоинт | API-клиент | Фронтенд-страница | Статус |
|-----------------|-----------|-------------------|--------|
| `POST /sessions` | `apiClient.createSession()` | `/play/[shareLink]/page.tsx` | ✅ |
| `GET /sessions/:teamId` | `apiClient.getSessionState()` | `/play/[shareLink]/[sessionId]/page.tsx` | ✅ |
| `POST /sessions/:teamId/answer` | `apiClient.submitAnswer()` | `/play/[shareLink]/[sessionId]/page.tsx` | ✅ |
| `POST /sessions/:teamId/finish` | `apiClient.finishSession()` | `/play/[shareLink]/[sessionId]/finish/page.tsx` | ✅ |

---

## ⚠️ Частично синхронизировано

### 7. Admin

| Бэкенд-эндпоинт | API-клиент | Фронтенд-страница | Статус |
|-----------------|-----------|-------------------|--------|
| `GET /admin/stats` | `apiClient.getAdminStats()` | `/admin/dashboard/page.tsx` | ✅ |
| `GET /admin/organizer-applications` | `apiClient.getPendingApplications()` | `/admin/organizers/applications/page.tsx` | ✅ |
| `POST .../approve` | `apiClient.approveApplication()` | `/admin/organizers/applications/page.tsx` | ✅ |
| `POST .../reject` | `apiClient.rejectApplication()` | `/admin/organizers/applications/page.tsx` | ✅ |
| `GET /admin/users` | `apiClient.getUsersAdmin()` | `/admin/users/page.tsx` | ✅ |
| `PATCH /admin/users/:id/block` | `apiClient.blockUser()` | `/admin/users/page.tsx` | ✅ |
| `PATCH /admin/users/:id/unblock` | `apiClient.unblockUser()` | `/admin/users/page.tsx` | ✅ |
| `PATCH /admin/users/:id/role` | `apiClient.changeUserRole()` | `/admin/users/page.tsx` | ✅ |
| `GET /admin/teams` | `apiClient.getAdminTeams()` | `/admin/teams/page.tsx` | ✅ |
| `GET /admin/teams/:id` | `apiClient.getAdminTeam()` | `/admin/teams/[id]/page.tsx` | ✅ |
| `PATCH /admin/teams/:id` | `apiClient.updateAdminTeam()` | `/admin/teams/[id]/page.tsx` | ✅ |
| `DELETE /admin/teams/:id` | `apiClient.deleteAdminTeam()` | `/admin/teams/[id]/page.tsx` | ✅ |
| `POST /admin/teams/:id/restore` | ❌ Нет в API-клиенте | ❌ Нет UI | ⚠️ |
| `GET /games/admin` | `apiClient.getAdminGames()` | `/admin/games/page.tsx` | ✅ |
| `POST /games/:id/admin/hide` | `apiClient.adminHideGame()` | `/admin/games/[id]/page.tsx` | ✅ |
| `POST /games/:id/admin/unhide` | `apiClient.adminUnhideGame()` | `/admin/games/[id]/page.tsx` | ✅ |
| `POST /games/:id/admin/block` | `apiClient.adminBlockGame()` | `/admin/games/[id]/page.tsx` | ✅ |
| `POST /games/:id/admin/unblock` | ❌ Нет в API-клиенте | ❌ Нет UI | ⚠️ |

### 8. Support

| Бэкенд-эндпоинт | API-клиент | Фронтенд-страница | Статус |
|-----------------|-----------|-------------------|--------|
| `POST /support` | `apiClient.createSupportTicket()` | `/support/page.tsx` + `SupportForm.tsx` | ✅ |
| `GET /support` | `apiClient.getSupportTickets()` | `/admin/support/page.tsx` | ✅ |
| `GET /support/stats` | `apiClient.getSupportStats()` | `/admin/support/page.tsx` | ✅ |
| `GET /support/:id` | `apiClient.getSupportTicket()` | `/admin/support/page.tsx` | ✅ |
| `PATCH /support/:id` | `apiClient.updateSupportTicket()` | `/admin/support/page.tsx` | ✅ |

### 9. Social (Friends, Chats)

| Бэкенд-эндпоинт | API-клиент | Фронтенд-страница | Статус |
|-----------------|-----------|-------------------|--------|
| `POST /users/:id/friend-request` | `apiClient.sendFriendRequest()` | `/profile/friends/page.tsx` | ✅ |
| `PATCH /users/friend-requests/:id` | `apiClient.respondToFriendRequest()` | `/profile/friends/page.tsx` | ✅ |
| `DELETE /users/friend-requests/:id` | `apiClient.cancelFriendRequest()` | `/profile/friends/page.tsx` | ✅ |
| `GET /users/me/friend-requests` | `apiClient.getFriendRequests()` | `/profile/friends/page.tsx` | ✅ |
| `GET /users/me/friends` | `apiClient.getMyFriends()` | `/profile/friends/page.tsx` | ✅ |
| `GET /users/:id/friends` | `apiClient.getUserFriends()` | `/profile/[id]/page.tsx` | ✅ |
| `DELETE /users/:id/friend` | `apiClient.removeFriend()` | `/profile/friends/page.tsx` | ✅ |
| `POST /users/:id/block` | `apiClient.socialBlockUser()` | `/profile/friends/page.tsx` | ✅ |
| `DELETE /users/:id/block` | `apiClient.socialUnblockUser()` | `/profile/friends/page.tsx` | ✅ |
| `GET /users/me/blocked` | `apiClient.getBlockedUsers()` | `/profile/friends/page.tsx` | ✅ |
| `POST /users/:id/chat` | `apiClient.sendMessage()` | `/profile/chats/page.tsx` | ✅ |
| `GET /users/me/chats` | `apiClient.getChats()` | `/profile/chats/page.tsx` | ✅ |
| `GET /users/:id/chat` | `apiClient.getChatHistory()` | `/profile/chats/page.tsx` | ✅ |

### 10. Marketplace

| Бэкенд-эндпоинт | API-клиент | Фронтенд-страница | Статус |
|-----------------|-----------|-------------------|--------|
| `GET /marketplace` | `searchMarketplace()` | `/marketplace/page.tsx` | ✅ |
| `GET /marketplace/categories` | `getMarketplaceCategories()` | `/marketplace/page.tsx` | ✅ |
| `GET /marketplace/types` | `getMarketplaceTypes()` | `/marketplace/page.tsx` | ✅ |
| `GET /marketplace/:id` | `getMarketplaceListing()` | `/marketplace/[id]/page.tsx` | ✅ |
| `POST /marketplace/:id/views` | `incrementListingViews()` | `/marketplace/[id]/page.tsx` | ✅ |
| `GET /marketplace/:id/reviews` | `getListingReviews()` | `/marketplace/[id]/page.tsx` | ✅ |
| `POST /marketplace` | `createListing()` | ❌ Нет UI для создания | ⚠️ |
| `PATCH /marketplace/:id` | `updateListing()` | ❌ Нет UI для редактирования | ⚠️ |
| `POST /marketplace/:id/publish` | `publishListing()` | ❌ Нет UI | ⚠️ |
| `POST /marketplace/:id/unpublish` | `unpublishListing()` | ❌ Нет UI | ⚠️ |
| `GET /marketplace/me/listings` | `getMyListings()` | ❌ Нет UI | ⚠️ |
| `GET /marketplace/me/sales` | `getMySales()` | ❌ Нет UI | ⚠️ |
| `GET /marketplace/me/earnings` | `getMyEarnings()` | ❌ Нет UI | ⚠️ |
| `POST /marketplace/:id/purchase` | `purchaseListing()` | `/marketplace/[id]/page.tsx` | ✅ |
| `POST /marketplace/:id/favorite` | `addFavoriteListing()` | `/marketplace/[id]/page.tsx` | ✅ |
| `DELETE /marketplace/:id/favorite` | `removeFavoriteListing()` | `/marketplace/[id]/page.tsx` | ✅ |
| `GET /marketplace/me/purchases` | `getMyPurchases()` | ❌ Нет UI | ⚠️ |
| `GET /marketplace/me/licenses` | `getMyLicenses()` | ❌ Нет UI | ⚠️ |
| `GET /marketplace/cart` | `getCart()` | ❌ Нет UI | ⚠️ |
| `POST /marketplace/cart` | `addToCart()` | ❌ Нет UI | ⚠️ |
| `DELETE /marketplace/cart/:id` | `removeFromCart()` | ❌ Нет UI | ⚠️ |
| `POST /marketplace/cart/clear` | `clearCart()` | ❌ Нет UI | ⚠️ |
| `GET /marketplace/cart/count` | `getCartCount()` | ❌ Нет UI | ⚠️ |
| `POST /marketplace/cart/checkout` | `checkoutCart()` | ❌ Нет UI | ⚠️ |
| `POST /marketplace/promo/validate` | `validatePromo()` | ❌ Нет UI | ⚠️ |
| `POST /marketplace/:id/review` | `createReview()` | ❌ Нет UI | ⚠️ |
| `PATCH /marketplace/reviews/:id` | `updateReview()` | ❌ Нет UI | ⚠️ |
| `DELETE /marketplace/reviews/:id` | `deleteReview()` | ❌ Нет UI | ⚠️ |
| `GET /marketplace/me/balance` | `getMyBalance()` | ❌ Нет UI | ⚠️ |
| `POST /marketplace/me/payouts` | `requestPayout()` | ❌ Нет UI | ⚠️ |
| `GET /marketplace/me/payouts` | `getMyPayouts()` | ❌ Нет UI | ⚠️ |
| `GET /marketplace/me/earnings-history` | `getMyEarningsHistory()` | ❌ Нет UI | ⚠️ |
| `GET /marketplace/me/analytics` | `getMyAnalytics()` | ❌ Нет UI | ⚠️ |
| `GET /marketplace/me/analytics/summary` | `getMyAnalyticsSummary()` | ❌ Нет UI | ⚠️ |

---

## ❌ Бэк есть → фронта нет

### 11. Games — дополнительные эндпоинты без UI

| Бэкенд-эндпоинт | API-клиент | Фронтенд | Статус |
|-----------------|-----------|---------|--------|
| `POST /games/:id/cancel` | ❌ Нет | ❌ Нет | ❌ |
| `POST /games/:id/reschedule` | ❌ Нет | ❌ Нет | ❌ |
| `POST /games/:id/move-to-lobby` | ❌ Нет | ❌ Нет | ❌ |
| `POST /games/:id/ready` | ❌ Нет | ❌ Нет | ❌ |
| `POST /games/:id/questions` | ❌ Нет | ❌ Нет | ❌ |
| `POST /games/:id/chat` | ❌ Нет | ❌ Нет | ❌ |
| `POST /games/:id/organizer-message` | ❌ Нет | ❌ Нет | ❌ |
| `POST /games/:id/upload-cover` | ❌ Нет | ❌ Нет | ❌ |
| `POST /games/:id/submit-for-review` | ❌ Нет | ❌ Нет | ❌ |
| `POST /games/:id/unregister` | ❌ Нет | ❌ Нет | ❌ |

### 12. Sessions — дополнительные эндпоинты без UI

| Бэкенд-эндпоинт | API-клиент | Фронтенд | Статус |
|-----------------|-----------|---------|--------|
| `POST /sessions/:teamId/hint` | ❌ Нет | ❌ Нет | ❌ |
| `GET /sessions/:teamId/current-node` | ❌ Нет | ❌ Нет | ❌ |
| `GET /sessions/:teamId/inventory` | ❌ Нет | ❌ Нет | ❌ |
| `POST /sessions/:teamId/inventory` | ❌ Нет | ❌ Нет | ❌ |
| `DELETE /sessions/:teamId/inventory/:itemId` | ❌ Нет | ❌ Нет | ❌ |
| `GET /sessions/:teamId/resources` | ❌ Нет | ❌ Нет | ❌ |

### 13. Users — дополнительные эндпоинты без UI

| Бэкенд-эндпоинт | API-клиент | Фронтенд | Статус |
|-----------------|-----------|---------|--------|
| `GET /users/:id/followers` | ❌ Нет | ❌ Нет | ❌ |
| `GET /users/:id/following` | ❌ Нет | ❌ Нет | ❌ |
| `POST /users/:id/follow` | ❌ Нет | ❌ Нет | ❌ |
| `DELETE /users/:id/follow` | ❌ Нет | ❌ Нет | ❌ |
| `GET /users/:id/favorites` | ❌ Нет | ❌ Нет | ❌ |
| `POST /users/me/favorites/:cat/:itemId` | ❌ Нет | ❌ Нет | ❌ |
| `DELETE /users/me/favorites/:cat/:itemId` | ❌ Нет | ❌ Нет | ❌ |
| `GET /users/:id/activity` | ❌ Нет | ❌ Нет | ❌ |
| `GET /users/:id/teams` | ❌ Нет | ❌ Нет | ❌ |
| `GET /users/:id/scenarios` | ❌ Нет | ❌ Нет | ❌ |
| `GET /users/:id/achievements` | ❌ Нет | ❌ Нет | ❌ |
| `DELETE /users/me` (soft delete) | ❌ Нет | ❌ Нет | ❌ |
| `POST /users/me/avatar` | `uploadAvatar()` | `/profile/edit/page.tsx` | ✅ |
| `DELETE /users/me/avatar` | ❌ Нет | ❌ Нет | ❌ |

### 14. Notifications

| Бэкенд-эндпоинт | API-клиент | Фронтенд | Статус |
|-----------------|-----------|---------|--------|
| `GET /notifications` | ❌ Нет (fetch напрямую) | `/notifications/page.tsx` | ⚠️ Прямой fetch, не через apiClient |
| `PATCH /notifications/read-all` | ❌ Нет (fetch напрямую) | `/notifications/page.tsx` | ⚠️ Прямой fetch |

### 15. Achievements

| Бэкенд-эндпоинт | API-клиент | Фронтенд | Статус |
|-----------------|-----------|---------|--------|
| `GET /achievements` | ❌ Нет | ❌ Нет | ❌ |
| `POST /achievements/check` | ❌ Нет | ❌ Нет | ❌ |

### 16. Activity Feed

| Бэкенд-эндпоинт | API-клиент | Фронтенд | Статус |
|-----------------|-----------|---------|--------|
| `GET /activity-feed` | ❌ Нет | ❌ Нет | ❌ |

### 17. Billing

| Бэкенд-эндпоинт | API-клиент | Фронтенд | Статус |
|-----------------|-----------|---------|--------|
| `GET /billing/limits` | `apiClient.get('/billing/limits')` | `/upgrade/page.tsx` | ⚠️ Через generic get() |

---

## ❌ Фронт есть → бэка нет (или не найден)

### 18. Страницы, чей бэкенд не найден

| Фронтенд-страница | Бэкенд-эндпоинт | Статус |
|-------------------|-----------------|--------|
| `/about/page.tsx` | ❌ Нет API | ⚠️ Статическая страница |
| `/contacts/page.tsx` | ❌ Нет API | ⚠️ Статическая страница |
| `/faq/page.tsx` | ❌ Нет API | ⚠️ Статическая страница |
| `/privacy/page.tsx` | ❌ Нет API | ⚠️ Статическая страница |
| `/terms/page.tsx` | ❌ Нет API | ⚠️ Статическая страница |
| `/debug/editor-test/page.tsx` | ❌ Нет API | ⚠️ Debug-страница |
| `/debug/engine-test/page.tsx` | ❌ Нет API | ⚠️ Debug-страница |
| `/upgrade/page.tsx` | `GET /billing/limits` | ⚠️ Использует generic get() |
| `/organizer/scenarios-v2/[id]/edit/page.tsx` | ❌ Непонятно, какой бэк | ⚠️ Возможно, использует те же /scenarios |
| `/organizer/scenarios-v2/create/page.tsx` | ❌ Непонятно, какой бэк | ⚠️ Возможно, использует те же /scenarios |

---

## 📊 Сводная статистика

| Категория | Количество |
|-----------|-----------|
| ✅ Полностью синхронизировано эндпоинтов | ~70 |
| ⚠️ Частично синхронизировано | ~35 |
| ❌ Бэк есть → фронта нет | ~25 |
| ❌ Фронт есть → бэка нет | ~10 (в основном статические) |
| **Всего проверено эндпоинтов** | **~140** |

### Проблемные зоны

1. **Marketplace** — бэкенд полностью реализован (30+ эндпоинтов), но на фронтенде только базовый просмотр каталога. Нет UI для: создания/редактирования листингов, корзины, оформления заказа, выплат, аналитики, отзывов на листинги.
2. **Games (gameplay)** — 10 эндпоинтов без UI: cancel, reschedule, move-to-lobby, ready, questions, chat, organizer-message, upload-cover, submit-for-review, unregister.
3. **Sessions (gameplay)** — 6 эндпоинтов без UI: hint, current-node, inventory CRUD, resources.
4. **Users (social/profile)** — 13 эндпоинтов без UI: follow system, favorites, activity feed, achievements, teams list, scenarios list, soft delete.
5. **Notifications** — используется прямой fetch вместо apiClient.
6. **Billing** — используется generic get() вместо типизированного метода.

### Рекомендации

1. **Создать страницы для Marketplace** — хотя бы базовые: создание листинга, корзина, покупки.
2. **Добавить UI для gameplay** — cancel/reschedule/move-to-lobby кнопки в организаторской панели.
3. **Добавить UI для чата во время игры** — `POST /games/:id/chat` и `POST /games/:id/organizer-message`.
4. **Добавить follow/favorites UI** — на странице профиля пользователя.
5. **Типизировать Notifications и Billing** в apiClient вместо прямых fetch/generic get.
6. **Добавить методы в apiClient** для отсутствующих эндпоинтов: cancel, reschedule, move-to-lobby, ready, questions, chat, organizer-message, upload-cover, submit-for-review, unregister, hint, current-node, inventory, resources, follow, favorites, activity, achievements, soft delete, avatar delete.