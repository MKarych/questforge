import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ActivityFeedService } from './activity-feed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('activity-feed')
export class ActivityFeedController {
  constructor(private readonly activityFeedService: ActivityFeedService) {}

  /**
   * GET /activity-feed — публичная лента активности
   */
  @Get()
  async getFeed(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.activityFeedService.getFeed(
      Number(limit) || 50,
      Number(offset) || 0,
    );
  }

  /**
   * GET /activity-feed/user/:userId — лента активности пользователя
   */
  @Get('user/:userId')
  async getUserFeed(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.activityFeedService.getUserFeed(
      userId,
      Number(limit) || 50,
      Number(offset) || 0,
    );
  }

  /**
   * GET /activity-feed/me — лента текущего пользователя
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyFeed(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const userId = req.user?.userId || req.user?.sub;
    return this.activityFeedService.getUserFeed(
      userId,
      Number(limit) || 50,
      Number(offset) || 0,
    );
  }
}