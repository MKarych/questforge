import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  /**
   * GET /achievements — список всех достижений (справочник)
   */
  @Get()
  getAllAchievements() {
    return this.achievementsService.getAllAchievements();
  }

  /**
   * GET /achievements/user — достижения текущего пользователя
   */
  @Get('user')
  @UseGuards(JwtAuthGuard)
  async getUserAchievements(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.achievementsService.getUserAchievements(userId);
  }

  /**
   * POST /achievements/check — проверить и выдать новые достижения
   */
  @Post('check')
  @UseGuards(JwtAuthGuard)
  async checkAchievements(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.achievementsService.checkAndAward(userId);
  }
}