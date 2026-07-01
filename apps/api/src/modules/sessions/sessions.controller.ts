import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRequest } from '../../common/types/user-request.type';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: UserRequest, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(req.user.userId, dto);
  }

  @Post(':teamId/answer')
  @UseGuards(JwtAuthGuard)
  async submitAnswer(
    @Param('teamId') teamId: string,
    @Body('gameId') gameId: string,
    @Body('answer') answer: string,
    @Body('nodeId') nodeId: string,
    @Body('stateVersion') stateVersion: number | undefined,
    @Request() req: UserRequest,
  ) {
    return this.sessionsService.submitAnswer(
      teamId,
      gameId,
      answer,
      nodeId,
      req.user.userId,
      stateVersion,
    );
  }

  /**
   * Request a hint for the current node.
   */
  @Post(':teamId/hint')
  @UseGuards(JwtAuthGuard)
  async requestHint(
    @Param('teamId') teamId: string,
    @Body('gameId') gameId: string,
    @Request() req: UserRequest,
  ) {
    return this.sessionsService.requestHint(teamId, gameId, req.user.userId);
  }

  /**
   * Get current node info with timer.
   */
  @Get(':teamId/current-node')
  @UseGuards(JwtAuthGuard)
  async getCurrentNode(
    @Param('teamId') teamId: string,
    @Body('gameId') gameId: string,
  ) {
    return this.sessionsService.getCurrentNode(teamId, gameId);
  }

  /**
   * Get team inventory.
   */
  @Get(':teamId/inventory')
  @UseGuards(JwtAuthGuard)
  async getInventory(@Param('teamId') teamId: string) {
    return this.sessionsService.getInventory(teamId);
  }

  /**
   * Add item to team inventory.
   */
  @Post(':teamId/inventory')
  @UseGuards(JwtAuthGuard)
  async addInventoryItem(
    @Param('teamId') teamId: string,
    @Body('item') item: Record<string, unknown>,
    @Request() req: UserRequest,
  ) {
    return this.sessionsService.addInventoryItem(teamId, item, req.user.userId);
  }

  /**
   * Remove item from team inventory.
   */
  @Delete(':teamId/inventory/:itemId')
  @UseGuards(JwtAuthGuard)
  async removeInventoryItem(
    @Param('teamId') teamId: string,
    @Param('itemId') itemId: string,
    @Request() req: UserRequest,
  ) {
    return this.sessionsService.removeInventoryItem(teamId, itemId, req.user.userId);
  }

  /**
   * Get team resources.
   */
  @Get(':teamId/resources')
  @UseGuards(JwtAuthGuard)
  async getResources(@Param('teamId') teamId: string) {
    return this.sessionsService.getResources(teamId);
  }

  @Get(':teamId')
  @UseGuards(JwtAuthGuard)
  async getState(@Param('teamId') teamId: string) {
    return this.sessionsService.getState(teamId);
  }

  @Post(':teamId/finish')
  @UseGuards(JwtAuthGuard)
  async finish(@Param('teamId') teamId: string) {
    return this.sessionsService.finish(teamId);
  }

  /**
   * Получить сессию команды для конкретной игры.
   * Используется для восстановления sessionId при повторном входе.
   */
  @Get('by-team/:teamId/game/:gameId')
  @UseGuards(JwtAuthGuard)
  async getSessionByTeamAndGame(
    @Param('teamId') teamId: string,
    @Param('gameId') gameId: string,
  ) {
    return this.sessionsService.getSessionByTeamAndGame(teamId, gameId);
  }
}
