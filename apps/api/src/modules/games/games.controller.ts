import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  // ============================================================
  // Public endpoints (no auth required)
  // ============================================================

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('city') city?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.gamesService.findAll({
      status,
      city,
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    });
  }

  @Get(':id')
  async findOne(@Param('id') gameId: string) {
    return this.gamesService.findOne(gameId);
  }

  @Get(':id/reviews')
  async getReviews(
    @Param('id') gameId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.gamesService.getReviews(gameId, {
      limit: Number(limit) || 10,
      offset: Number(offset) || 0,
    });
  }

  @Get(':id/teams')
  async getTeams(
    @Param('id') gameId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.gamesService.getTeams(gameId, {
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    });
  }

  // ============================================================
  // Protected endpoints (auth required)
  // ============================================================

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: any, @Body() dto: CreateGameDto) {
    return this.gamesService.create(req.user.userId, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Request() req: any,
    @Param('id') gameId: string,
    @Body() dto: Partial<CreateGameDto>,
  ) {
    return this.gamesService.update(req.user.userId, gameId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Request() req: any, @Param('id') gameId: string) {
    return this.gamesService.remove(req.user.userId, gameId);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  async submitForModeration(@Request() req: any, @Param('id') gameId: string) {
    return this.gamesService.submitForModeration(req.user.userId, gameId);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  async startGame(@Request() req: any, @Param('id') gameId: string) {
    return this.gamesService.startGame(req.user.userId, gameId);
  }

  @Post(':id/finish')
  @UseGuards(JwtAuthGuard)
  async finishGame(@Request() req: any, @Param('id') gameId: string) {
    return this.gamesService.finishGame(req.user.userId, gameId);
  }
}
