import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(req.user.userId, dto);
  }

  @Post(':teamId/answer')
  async submitAnswer(
    @Param('teamId') teamId: string,
    @Body('gameId') gameId: string,
    @Body('answer') answer: string,
    @Body('nodeId') nodeId: string,
  ) {
    return this.sessionsService.submitAnswer(teamId, gameId, answer, nodeId);
  }

  @Get(':teamId')
  async getState(@Param('teamId') teamId: string) {
    return this.sessionsService.getState(teamId);
  }

  @Post(':teamId/finish')
  async finish(@Param('teamId') teamId: string) {
    return this.sessionsService.finish(teamId);
  }
}
