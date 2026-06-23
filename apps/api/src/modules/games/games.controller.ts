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
  Req,
  Request,
  UploadedFile,
  UseInterceptors,
  ForbiddenException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  constructor(private readonly gamesService: GamesService) {}

  // ============================================================
  // Public endpoints (no auth required)
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

  @Get('public/:shareLink')
  async findOneByShareLink(@Param('shareLink') shareLink: string) {
    return this.gamesService.findOneByShareLink(shareLink);
  }

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

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publishGame(@Request() req: any, @Param('id') gameId: string) {
    return this.gamesService.publishGame(req.user.userId, gameId);
  }

  @Post(':id/upload-cover')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads/covers',
        filename: (_req: any, file: DiskStorageFile, callback: FileCallback) => {
          const ext = extname(file.originalname);
          const filename = `${uuidv4()}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (_req: any, file: DiskStorageFile, callback: (error: Error | null, acceptFile: boolean) => void) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new ForbiddenException('Разрешены только изображения: jpg, png, webp'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
      },
    }),
  )
  async uploadCover(
    @Req() req: Request,
    @Param('id') gameId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = (req as any).user?.userId;
    return this.gamesService.uploadCover(userId, gameId, file);
  }
}
