import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { ModerateComplaintDto } from './dto/moderate-complaint.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller()
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  // ============================================================
  // Публичные эндпоинты (любой авторизованный пользователь)
  // ============================================================

  @Post('complaints')
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateComplaintDto, @Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.complaintsService.create(userId, dto);
  }

  // ============================================================
  // Админ-эндпоинты (ADMIN / MODERATOR)
  // ============================================================

  @Get('admin/complaints')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async findAll(
    @Query('status') status?: string,
    @Query('targetType') targetType?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.complaintsService.findAll({
      status,
      targetType,
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    });
  }

  @Get('admin/complaints/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async findById(@Param('id') id: string) {
    return this.complaintsService.findById(id);
  }

  @Post('admin/complaints/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async approve(
    @Param('id') id: string,
    @Body() dto: ModerateComplaintDto,
    @Request() req: any,
  ) {
    const moderatorId = req.user?.userId || req.user?.sub;
    return this.complaintsService.approve(id, moderatorId, dto);
  }

  @Post('admin/complaints/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async reject(
    @Param('id') id: string,
    @Body('moderationNote') moderationNote: string,
    @Request() req: any,
  ) {
    const moderatorId = req.user?.userId || req.user?.sub;
    return this.complaintsService.reject(id, moderatorId, moderationNote);
  }
}