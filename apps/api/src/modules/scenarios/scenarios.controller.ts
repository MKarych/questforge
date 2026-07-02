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
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { ScenariosService } from './scenarios.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('scenarios')
@UseGuards(JwtAuthGuard)
export class ScenariosController {
  private readonly logger = new Logger(ScenariosController.name);
  constructor(private readonly scenariosService: ScenariosService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateScenarioDto) {
    return this.scenariosService.create(req.user.userId, dto);
  }

  @Get()
  async findAll(
    @Request() req: any,
    @Query('published') published?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.scenariosService.findAll(req.user.userId, {
      published: published !== undefined ? published === 'true' : undefined,
      limit: Number(limit),
      offset: Number(offset),
    });
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') scenarioId: string) {
    return this.scenariosService.findOne(req.user.userId, scenarioId);
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') scenarioId: string,
    @Body() dto: Partial<CreateScenarioDto>,
  ) {
    return this.scenariosService.update(req.user.userId, scenarioId, dto);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') scenarioId: string) {
    return this.scenariosService.delete(req.user.userId, scenarioId);
  }

  @Post(':id/validate')
  async validate(@Request() req: any, @Param('id') scenarioId: string) {
    return this.scenariosService.validate(req.user.userId, scenarioId);
  }

  @Post(':id/publish')
  async publish(
    @Request() req: any,
    @Param('id') scenarioId: string,
    @Body('price') price?: number,
    @Body('licenseType') licenseType?: string,
  ) {
    return this.scenariosService.publish(req.user.userId, scenarioId, price, licenseType);
  }

  @Post(':id/version')
  async createVersion(
    @Request() req: any,
    @Param('id') scenarioId: string,
    @Body('nodes') nodes: any[],
    @Body('versionNote') versionNote?: string,
  ) {
    return this.scenariosService.createVersion(req.user.userId, scenarioId, nodes, versionNote);
  }

  // ============================================================
  // Admin endpoints — модерация сценариев
  // ============================================================

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async adminGetPending(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.scenariosService.adminGetPending(Number(limit) || 20, Number(offset) || 0);
  }

  @Post('admin/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async adminApprove(@Param('id') id: string, @Request() req: any) {
    const moderatorId = req.user?.userId || req.user?.sub;
    return this.scenariosService.adminApprove(id, moderatorId);
  }

  @Post('admin/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async adminReject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    const moderatorId = req.user?.userId || req.user?.sub;
    return this.scenariosService.adminReject(id, moderatorId, reason);
  }
}

