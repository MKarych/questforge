import {
  Controller, Get, Patch, Post, Delete,
  Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { UserRequest } from '../../common/types/user-request.type';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ============================================================
  // PUBLIC PROFILE
  // ============================================================

  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  async getPublicProfile(@Param('id') userId: string, @Request() req: UserRequest) {
    const id = userId === 'me' ? req.user?.userId : userId;
    return this.usersService.getPublicProfile(id);
  }

  // ============================================================
  // PRIVATE PROFILE
  // ============================================================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Request() req: UserRequest) {
    return this.usersService.getMyProfile(req.user.userId);
  }

  // ============================================================
  // UPDATE PROFILE
  // ============================================================

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: UserRequest,
    @Body() dto: any,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.usersService.updateProfile(req.user.userId, dto, ip, userAgent);
  }

  // ============================================================
  // AVATAR
  // ============================================================

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  async updateAvatar(
    @Request() req: UserRequest,
    @Body() body: { avatarUrl: string },
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.usersService.updateAvatar(req.user.userId, body.avatarUrl, ip, userAgent);
  }

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAvatar(@Request() req: UserRequest) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.usersService.deleteAvatar(req.user.userId, ip, userAgent);
  }

  // ============================================================
  // SOFT DELETE
  // ============================================================

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Request() req: UserRequest) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.usersService.deleteUser(req.user.userId, ip, userAgent);
  }

  // ============================================================
  // FOLLOW SYSTEM
  // ============================================================

  @Get(':id/followers')
  @UseGuards(OptionalAuthGuard)
  async getFollowers(
    @Param('id') userId: string,
    @Request() req: UserRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const id = userId === 'me' ? req.user?.userId : userId;
    return this.usersService.getFollowers(id, Number(limit) || 20, Number(offset) || 0);
  }

  @Get(':id/following')
  @UseGuards(OptionalAuthGuard)
  async getFollowing(
    @Param('id') userId: string,
    @Request() req: UserRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const id = userId === 'me' ? req.user?.userId : userId;
    return this.usersService.getFollowing(id, Number(limit) || 20, Number(offset) || 0);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  async followUser(@Request() req: UserRequest, @Param('id') followingId: string) {
    return this.usersService.followUser(req.user.userId, followingId);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unfollowUser(@Request() req: UserRequest, @Param('id') followingId: string) {
    return this.usersService.unfollowUser(req.user.userId, followingId);
  }

  // ============================================================
  // FAVORITES
  // ============================================================

  @Get(':id/favorites')
  @UseGuards(OptionalAuthGuard)
  async getFavorites(@Param('id') userId: string, @Request() req: UserRequest) {
    const id = userId === 'me' ? req.user?.userId : userId;
    return this.usersService.getFavorites(id);
  }

  @Post('me/favorites/:category/:itemId')
  @UseGuards(JwtAuthGuard)
  async addFavorite(
    @Request() req: UserRequest,
    @Param('category') category: string,
    @Param('itemId') itemId: string,
  ) {
    return this.usersService.addFavorite(
      req.user.userId,
      category as 'games' | 'scenarios' | 'authors',
      itemId,
    );
  }

  @Delete('me/favorites/:category/:itemId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeFavorite(
    @Request() req: UserRequest,
    @Param('category') category: string,
    @Param('itemId') itemId: string,
  ) {
    return this.usersService.removeFavorite(
      req.user.userId,
      category as 'games' | 'scenarios' | 'authors',
      itemId,
    );
  }

  // ============================================================
  // ACTIVITY FEED
  // ============================================================

  @Get(':id/activity')
  @UseGuards(OptionalAuthGuard)
  async getActivityFeed(
    @Param('id') userId: string,
    @Request() req: UserRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const id = userId === 'me' ? req.user?.userId : userId;
    return this.usersService.getActivityFeed(id, Number(limit) || 20, Number(offset) || 0);
  }

  // ============================================================
  // USER'S TEAMS
  // ============================================================

  @Get(':id/teams')
  @UseGuards(OptionalAuthGuard)
  async getUserTeams(@Param('id') userId: string, @Request() req: UserRequest) {
    const id = userId === 'me' ? req.user?.userId : userId;
    return this.usersService.getUserTeams(id);
  }

  // ============================================================
  // USER'S SCENARIOS
  // ============================================================

  @Get(':id/scenarios')
  @UseGuards(OptionalAuthGuard)
  async getUserScenarios(
    @Param('id') userId: string,
    @Request() req: UserRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const id = userId === 'me' ? req.user?.userId : userId;
    return this.usersService.getUserScenarios(id, Number(limit) || 20, Number(offset) || 0);
  }

  // ============================================================
  // ACHIEVEMENTS
  // ============================================================

  @Get(':id/achievements')
  @UseGuards(OptionalAuthGuard)
  async getUserAchievements(@Param('id') userId: string, @Request() req: UserRequest) {
    const id = userId === 'me' ? req.user?.userId : userId;
    return this.usersService.getUserAchievements(id);
  }

  @Post('me/check-achievements')
  @UseGuards(JwtAuthGuard)
  async checkAchievements(@Request() req: UserRequest) {
    return this.usersService.checkAndAwardAchievements(req.user.userId);
  }

  // ============================================================
  // REVIEWS
  // ============================================================

  @Get(':id/reviews')
  @UseGuards(OptionalAuthGuard)
  async getUserReviews(
    @Param('id') userId: string,
    @Request() req: UserRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const id = userId === 'me' ? req.user?.userId : userId;
    return this.usersService.getUserReviews(id, Number(limit) || 20, Number(offset) || 0);
  }

  // ============================================================
  // ADMIN PROFILE
  // ============================================================

  @Get(':id/admin')
  @UseGuards(JwtAuthGuard)
  async getAdminProfile(@Param('id') userId: string, @Request() req: UserRequest) {
    const id = userId === 'me' ? req.user.userId : userId;
    return this.usersService.getAdminProfile(id);
  }

  // ============================================================
  // TRUST SCORE & CAPABILITIES (recalculate)
  // ============================================================

  @Post('me/recalculate-trust')
  @UseGuards(JwtAuthGuard)
  async recalculateTrustScore(@Request() req: UserRequest) {
    return this.usersService.recalculateTrustScore(req.user.userId);
  }

  @Post('me/recalculate-capabilities')
  @UseGuards(JwtAuthGuard)
  async recalculateCapabilities(@Request() req: UserRequest) {
    return this.usersService.recalculateCapabilities(req.user.userId);
  }
}
