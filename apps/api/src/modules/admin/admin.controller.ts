import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { TeamsService } from '../teams/teams.service';
import { UpdateTeamDto } from '../teams/dto/update-team.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly teamsService: TeamsService,
  ) {}

  // ============================================================
  // Dashboard
  // ============================================================

  @Get('stats')
  @Roles('ADMIN', 'MODERATOR')
  async getStats() {
    return this.adminService.getStats();
  }

  // ============================================================
  // Notification Counts (для бейджей в шапке)
  // ============================================================

  @Get('notification-counts')
  @Roles('ADMIN', 'MODERATOR')
  async getNotificationCounts() {
    return this.adminService.getNotificationCounts();
  }

  // ============================================================
  // Organizer Applications
  // ============================================================

  @Get('organizer-applications')
  @Roles('ADMIN', 'MODERATOR')
  async getPendingApplications() {
    return this.adminService.getPendingApplications();
  }

  @Post('organizer-applications/:id/approve')
  @Roles('ADMIN', 'MODERATOR')
  async approveApplication(@Param('id') applicationId: string, @Request() req: any) {
    const moderatorId = req.user?.userId || req.user?.sub;
    return this.adminService.approveApplication(applicationId, moderatorId);
  }

  @Post('organizer-applications/:id/reject')
  @Roles('ADMIN', 'MODERATOR')
  async rejectApplication(
    @Param('id') applicationId: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    const moderatorId = req.user?.userId || req.user?.sub;
    return this.adminService.rejectApplication(applicationId, reason, moderatorId);
  }

  // ============================================================
  // Users Management (ADMIN only)
  // ============================================================

  @Get('users')
  @Roles('ADMIN')
  async getUsers(
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.getUsers({
      search,
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    });
  }

  @Patch('users/:id/block')
  @Roles('ADMIN')
  async blockUser(@Param('id') userId: string) {
    return this.adminService.blockUser(userId);
  }

  @Patch('users/:id/unblock')
  @Roles('ADMIN')
  async unblockUser(@Param('id') userId: string) {
    return this.adminService.unblockUser(userId);
  }

  @Patch('users/:id/role')
  @Roles('ADMIN')
  async changeUserRole(
    @Param('id') userId: string,
    @Body('role') role: string,
  ) {
    return this.adminService.changeUserRole(userId, role);
  }

  // ============================================================
  // Teams Management
  // ============================================================

  @Get('teams')
  @Roles('ADMIN', 'MODERATOR')
  async getAllTeams(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('city') city?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.teamsService.getAllTeams({
      search,
      status,
      city,
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    });
  }

  @Get('teams/:id')
  @Roles('ADMIN', 'MODERATOR')
  async getTeamDetails(@Param('id') id: string) {
    return this.teamsService.getTeamDetails(id);
  }

  @Patch('teams/:id')
  @Roles('ADMIN', 'MODERATOR')
  async updateTeam(
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.userId || req.user?.sub;
    return this.teamsService.adminUpdateTeam(actorId, id, dto);
  }

  @Delete('teams/:id')
  @Roles('ADMIN')
  async deleteTeam(@Param('id') id: string, @Request() req: any) {
    const actorId = req.user?.userId || req.user?.sub;
    return this.teamsService.adminDeleteTeam(actorId, id);
  }

  @Post('teams/:id/restore')
  @Roles('ADMIN')
  async restoreTeam(@Param('id') id: string, @Request() req: any) {
    const actorId = req.user?.userId || req.user?.sub;
    return this.teamsService.adminRestoreTeam(actorId, id);
  }
}