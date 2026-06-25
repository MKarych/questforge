import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ============================================================
  // Public: Create ticket (доступно всем, даже без авторизации)
  // ============================================================

  @Post()
  @UseGuards(OptionalAuthGuard)
  async create(@Body() dto: CreateTicketDto, @Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.supportService.createTicket(dto, userId);
  }

  // ============================================================
  // Admin/Moderator: List tickets
  // ============================================================

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async findAll(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.supportService.getTickets({
      status,
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    });
  }

  // ============================================================
  // Admin/Moderator: Stats (должен быть ПЕРЕД :id, чтобы не перехватывался)
  // ============================================================

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async stats() {
    return this.supportService.getStats();
  }

  // ============================================================
  // Admin/Moderator: Get single ticket
  // ============================================================

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async findOne(@Param('id') id: string) {
    return this.supportService.getTicket(id);
  }

  // ============================================================
  // Admin/Moderator: Update ticket (assign, respond, close)
  // ============================================================

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @Request() req: any,
  ) {
    const moderatorId = req.user?.userId || req.user?.sub;
    return this.supportService.updateTicket(id, dto, moderatorId);
  }
}