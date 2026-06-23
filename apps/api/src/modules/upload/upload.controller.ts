import {
  Controller, Post, UseGuards, UseInterceptors,
  UploadedFile, Request, BadRequestException, HttpCode, HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRequest } from '../../common/types/user-request.type';
import { UsersService } from '../users/users.service';

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly usersService: UsersService) {}

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'public', 'uploads', 'avatars'),
        filename: (_req, file, callback) => {
          const ext = extname(file.originalname).toLowerCase();
          const name = `avatar-${uuidv4()}${ext}`;
          callback(null, name);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, callback) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Допустимы только JPG, PNG, WEBP'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: UserRequest,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`;
    this.logger.log(`Avatar uploaded for user ${req.user.userId}: ${avatarUrl}`);

    // Сохраняем URL аватара в профиле пользователя
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.usersService.updateAvatar(req.user.userId, avatarUrl, ip, userAgent);

    // Возвращаем avatarUrl в формате, который ожидает фронтенд
    return { avatarUrl: result.avatarUrl };
  }
}