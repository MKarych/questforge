import { Controller, Get, Post, Delete, Body, Param, Request, Query, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRequest } from '../../common/types/user-request.type';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  /**
   * Создать новую команду
   */
  @Post()
  async create(@Request() req: UserRequest, @Body() dto: CreateTeamDto) {
    const result = await this.teamsService.create(req.user.userId, dto);
    return result;
  }

  /**
   * Получить список команд
   */
  @Get()
  async findAll(@Query('city') city?: string, @Query('limit') limit?: number, @Query('offset') offset?: number) {
    const result = await this.teamsService.findAll({
      city,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Получить детали команды
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.teamsService.findOne(id);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Пригласить пользователя в команду
   */
  @Post(':id/invite')
  async invite(@Request() req: UserRequest, @Param('id') teamId: string, @Body() dto: InviteUserDto) {
    const result = await this.teamsService.invite(req.user.userId, teamId, dto);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Вступить в команду
   */
  @Post(':id/join')
  async join(@Request() req: UserRequest, @Param('id') teamId: string) {
    const result = await this.teamsService.join(req.user.userId, teamId);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Покинуть команду
   */
  @Delete(':id/members/me')
  async leave(@Request() req: UserRequest, @Param('id') teamId: string) {
    const result = await this.teamsService.leave(req.user.userId, teamId);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Исключить участника
   */
  @Delete(':id/members/:userId')
  async removeMember(@Request() req: UserRequest, @Param('id') teamId: string, @Param('userId') userId: string) {
    const result = await this.teamsService.removeMember(req.user.userId, teamId, userId);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Получить мою команду
   */
  @Get('me/team')
  async getMyTeam(@Request() req: UserRequest) {
    const result = await this.teamsService.getMyTeam(req.user.userId);
    return {
      success: true,
      data: result,
    };
  }
}
