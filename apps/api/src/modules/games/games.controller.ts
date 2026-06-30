import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  ForbiddenException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GamesService } from './games.service';
import { ChatService } from './chat.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

type FileCallback = (error: Error | null, filename: string) => void;
type DiskStorageFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
};

@Controller('games')
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly chatService: ChatService,
  ) {}

  // ============================================================
  // 29.1. Публичные эндпоинты (no auth)
  // ============================================================

  @Get('public')
  async findAllPublic(
    @Query('city') city?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('type') type?: string,
    @Query('sort') sort?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.gamesService.findAllPublic({
      city,
      dateFrom,
      dateTo,
      type,
      sort,
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    });
  }

  @Get('public/share/:shareLink')
  async findOneByShareLink(@Param('shareLink') shareLink: string) {
    return this.gamesService.findOneByShareLink(shareLink);
  }

  @Get('public/:id')
  @UseGuards(OptionalAuthGuard)
  async findOnePublic(@Param('id') id: string, @Request() req: any) {
    return this.gamesService.findOnePublic(id, req.user?.id);
  }

  @Get('public/:id/reviews')
  async getPublicReviews(
    @Param('id') gameId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.gamesService.getReviews(gameId, {
      limit: Number(limit) || 10,
      offset: Number(offset) || 0,
    });
  }

  @Get('public/:id/comments')
  async getPublicComments(
    @Param('id') gameId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.gamesService.getComments(gameId, {
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    });
  }

  @Post('public/:id/comments')
  @UseGuards(JwtAuthGuard)
  async addPublicComment(
    @Param('id') gameId: string,
    @Body() body: { text: string },
    @Request() req: any,
  ) {
    return this.gamesService.addComment(gameId, req.user.userId, body.text);
  }

  @Delete('public/:id/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  async deletePublicComment(
    @Param('id') gameId: string,
    @Param('commentId') commentId: string,
    @Request() req: any,
  ) {
    return this.gamesService.deleteComment(commentId, req.user.userId, req.user.role);
  }

  @Patch('public/:id/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  async updatePublicComment(
    @Param('id') gameId: string,
    @Param('commentId') commentId: string,
    @Body() body: { text: string },
    @Request() req: any,
  ) {
    return this.gamesService.updateComment(commentId, req.user.userId, body.text);
  }

  // ============================================================
  // 29.2. Приватные эндпоинты (auth required)
  // ============================================================

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  async registerTeam(
    @Param('id') gameId: string,
    @Body() body: { teamId: string },
    @Request() req: any,
  ) {
    return this.gamesService.registerTeam(gameId, body.teamId, req.user.userId);
  }

  @Post(':id/unregister')
  @UseGuards(JwtAuthGuard)
  async unregisterTeam(
    @Param('id') gameId: string,
    @Body() body: { teamId: string },
    @Request() req: any,
  ) {
    return this.gamesService.unregisterTeam(gameId, body.teamId, req.user.userId);
  }

  @Get(':id/teams')
  @UseGuards(JwtAuthGuard)
  async getTeams(@Param('id') gameId: string) {
    return this.gamesService.getTeams(gameId);
  }

  @Post(':id/ready')
  @UseGuards(JwtAuthGuard)
  async setTeamReady(
    @Param('id') gameId: string,
    @Body() body: { teamId: string },
    @Request() req: any,
  ) {
    return this.gamesService.setTeamReady(gameId, body.teamId, req.user.userId);
  }

  @Get(':id/teams-status')
  @UseGuards(JwtAuthGuard)
  async getTeamsStatus(@Param('id') gameId: string) {
    return this.gamesService.getTeamsStatus(gameId);
  }

  // Questions
  @Post(':id/questions')
  @UseGuards(JwtAuthGuard)
  async askQuestion(
    @Param('id') gameId: string,
    @Body() body: { text: string },
    @Request() req: any,
  ) {
    return this.gamesService.addComment(gameId, req.user.userId, body.text);
  }

  @Get(':id/questions')
  @UseGuards(JwtAuthGuard)
  async getQuestions(@Param('id') gameId: string) {
    return this.gamesService.getComments(gameId, { limit: 50, offset: 0 });
  }

  // Chat
  @Get(':id/chat')
  @UseGuards(JwtAuthGuard)
  async getChatMessages(@Param('id') gameId: string, @Request() req: any) {
    return this.chatService.getChatMessages(gameId, req.user.userId);
  }

  @Post(':id/chat')
  @UseGuards(JwtAuthGuard)
  async sendChatMessage(
    @Param('id') gameId: string,
    @Body() body: { text: string },
    @Request() req: any,
  ) {
    return this.chatService.sendMessage(gameId, req.user.userId, body.text);
  }

  @Get(':id/chat/organizer')
  @UseGuards(JwtAuthGuard)
  async getOrganizerMessages(@Param('id') gameId: string, @Request() req: any) {
    return this.chatService.getChatMessages(gameId, req.user.userId);
  }

  @Post(':id/chat/organizer')
  @UseGuards(JwtAuthGuard)
  async sendOrganizerMessage(
    @Param('id') gameId: string,
    @Body() body: { text: string },
    @Request() req: any,
  ) {
    return this.chatService.sendOrganizerMessage(gameId, req.user.userId, body.text);
  }

  // ============================================================
  // 29.3. Организаторские эндпоинты (auth required)
  // ============================================================

  @Post()
  @UseGuards(JwtAuthGuard)
  async createGame(@Request() req: any, @Body() dto: CreateGameDto) {
    return this.gamesService.createGame(dto, req.user.userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async findMyGames(@Request() req: any) {
    return this.gamesService.findMyGames(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') gameId: string) {
    return this.gamesService.findOne(gameId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateGame(
    @Request() req: any,
    @Param('id') gameId: string,
    @Body() dto: UpdateGameDto,
  ) {
    return this.gamesService.updateGame(gameId, dto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteGame(@Request() req: any, @Param('id') gameId: string) {
    return this.gamesService.deleteGame(gameId, req.user.userId);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelGame(@Request() req: any, @Param('id') gameId: string) {
    return this.gamesService.cancelGame(gameId, req.user.userId);
  }

  @Post(':id/reschedule')
  @UseGuards(JwtAuthGuard)
  async rescheduleGame(
    @Request() req: any,
    @Param('id') gameId: string,
    @Body() body: { date: string; time: string },
  ) {
    return this.gamesService.rescheduleGame(gameId, req.user.userId, body.date, body.time);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publishGame(@Request() req: any, @Param('id') gameId: string) {
    return this.gamesService.publishGame(gameId, req.user.userId);
  }

  @Post(':id/open-registration')
  @UseGuards(JwtAuthGuard)
  async openRegistration(@Request() req: any, @Param('id') gameId: string) {
    return this.gamesService.openRegistration(gameId, req.user.userId);
  }

  @Post(':id/close-registration')
  @UseGuards(JwtAuthGuard)
  async closeRegistration(@Request() req: any, @Param('id') gameId: string) {
    return this.gamesService.closeRegistration(gameId, req.user.userId);
  }

  @Post(':id/move-to-lobby')
  @UseGuards(JwtAuthGuard)
  async moveToLobby(@Request() req: any, @Param('id') gameId: string) {
    return this.gamesService.moveToLobby(gameId, req.user.userId);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  async startGame(@Request() req: any, @Param('id') gameId: string) {
    return this.gamesService.startGame(gameId, req.user.userId);
  }

  @Get(':id/can-start')
  @UseGuards(JwtAuthGuard)
  async canStart(@Param('id') gameId: string) {
    return this.gamesService.canStart(gameId);
  }

  @Get(':id/timer')
  @UseGuards(JwtAuthGuard)
  async getTimer(@Param('id') gameId: string) {
    return this.gamesService.getTimer(gameId);
  }

  @Post(':id/finish')
  @UseGuards(JwtAuthGuard)
  async finishGame(@Request() req: any, @Param('id') gameId: string) {
    return this.gamesService.finishGame(gameId, req.user.userId);
  }

  // ============================================================
  // 29.4. Отзывы (Reviews)
  // ============================================================

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  async addReview(
    @Param('id') gameId: string,
    @Body() body: { rating: number; text?: string },
    @Request() req: any,
  ) {
    return this.gamesService.addReview(gameId, req.user.userId, body.rating, body.text);
  }

  // ============================================================
  // 29.5. Регистрация команды по названию
  // ============================================================

  @Post(':id/register-by-name')
  @UseGuards(JwtAuthGuard)
  async registerTeamByName(
    @Param('id') gameId: string,
    @Body() body: { teamName: string },
    @Request() req: any,
  ) {
    return this.gamesService.registerTeamByName(gameId, body.teamName, req.user.userId);
  }

  // ============================================================
  // 29.6. Админские эндпоинты (ADMIN/MODERATOR only)
  // ============================================================

  @Get('admin/all')
  @Roles('ADMIN', 'MODERATOR')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async adminFindAll(
    @Query('status') status?: string,
    @Query('city') city?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.gamesService.adminFindAll({
      status,
      city,
      search,
      limit: Number(limit) || 50,
      offset: Number(offset) || 0,
    });
  }

  @Patch('admin/:id/hide')
  @Roles('ADMIN', 'MODERATOR')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async adminHideGame(
    @Param('id') gameId: string,
    @Body() body: { comment?: string },
    @Request() req: any,
  ) {
    return this.gamesService.adminHideGame(gameId, req.user.userId, body.comment);
  }

  @Patch('admin/:id/unhide')
  @Roles('ADMIN', 'MODERATOR')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async adminUnhideGame(@Param('id') gameId: string, @Request() req: any) {
    return this.gamesService.adminUnhideGame(gameId, req.user.userId);
  }

  @Patch('admin/:id/block')
  @Roles('ADMIN', 'MODERATOR')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async adminBlockGame(
    @Param('id') gameId: string,
    @Body() body: { comment?: string },
    @Request() req: any,
  ) {
    return this.gamesService.adminBlockGame(gameId, req.user.userId, body.comment);
  }

  @Delete('admin/:id')
  @Roles('ADMIN', 'MODERATOR')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async adminDeleteGame(@Param('id') gameId: string, @Request() req: any) {
    return this.gamesService.adminDeleteGame(gameId, req.user.userId);
  }
}
