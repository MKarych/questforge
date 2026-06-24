import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications — список уведомлений пользователя с пагинацией
   */
  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const userId = req.user?.userId || req.user?.sub;
    return this.notificationsService.getUserNotifications(userId, {
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    });
  }

  /**
   * GET /notifications/recent — последние уведомления для выпадашки
   */
  @Get('recent')
  async getRecent(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.notificationsService.getRecentNotifications(userId);
  }

  /**
   * GET /notifications/unread-count — количество непрочитанных
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  /**
   * PATCH /notifications/:id/read — отметить одно уведомление прочитанным
   */
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    const result = await this.notificationsService.markAsRead(id, userId);
    if (!result) {
      return { message: 'Уведомление не найдено' };
    }
    return result;
  }

  /**
   * PATCH /notifications/read-all — отметить все уведомления прочитанными
   */
  @Patch('read-all')
  async markAllAsRead(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.notificationsService.markAllAsRead(userId);
  }
}