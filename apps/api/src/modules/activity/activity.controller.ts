import { Controller, Get, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /**
   * GET /api/activity/live?limit=10
   * Возвращает последние события для блока "Прямо сейчас".
   */
  @Get('live')
  async getLiveEvents(@Query('limit') limit?: string) {
    const events = await this.activityService.getLiveEvents(
      limit ? parseInt(limit, 10) : 10,
    );
    return { data: events };
  }
}