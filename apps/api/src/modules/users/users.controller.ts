import { Controller, Get, Patch, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRequest } from '../../common/types/user-request.type';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getPublicProfile(@Param('id') userId: string) {
    return this.usersService.getPublicProfile(userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Request() req: UserRequest) {
    return this.usersService.getMyProfile(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req: UserRequest, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  async updateAvatar(@Request() req: UserRequest, @Body() body: { avatarUrl: string }) {
    return this.usersService.updateAvatar(req.user.userId, body.avatarUrl);
  }

  @Post('me/check-achievements')
  @UseGuards(JwtAuthGuard)
  async checkAchievements(@Request() req: UserRequest) {
    return this.usersService.checkAndAwardAchievements(req.user.userId);
  }
}
