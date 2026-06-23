import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Request, Query, UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRequest } from '../../common/types/user-request.type';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // ================================================================
  // CREATE
  // ================================================================
  @Post()
  async create(@Request() req: UserRequest, @Body() dto: CreateTeamDto) {
    const result = await this.teamsService.create(req.user.userId, dto);
    return { success: true, data: result };
  }

  // ================================================================
  // FIND ALL
  // ================================================================
  @Get()
  async findAll(
    @Query('city') city?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('tags') tags?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const result = await this.teamsService.findAll({
      city,
      search,
      status: status as any,
      tags: tags ? tags.split(',') : undefined,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });
    return { success: true, data: result };
  }

  // ================================================================
  // FIND ONE (public)
  // ================================================================
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.teamsService.findOne(id);
    return { success: true, data: result };
  }

  // ================================================================
  // FIND PRIVATE (for members)
  // ================================================================
  @Get(':id/private')
  async findPrivate(@Request() req: UserRequest, @Param('id') id: string) {
    const result = await this.teamsService.findPrivate(id, req.user.userId);
    return { success: true, data: result };
  }

  // ================================================================
  // UPDATE
  // ================================================================
  @Patch(':id')
  async update(
    @Request() req: UserRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
  ) {
    const result = await this.teamsService.update(req.user.userId, id, dto);
    return { success: true, data: result };
  }

  // ================================================================
  // DELETE (Soft Delete)
  // ================================================================
  @Delete(':id')
  async delete(@Request() req: UserRequest, @Param('id') id: string) {
    const result = await this.teamsService.delete(req.user.userId, id);
    return { success: true, data: result };
  }

  // ================================================================
  // GET MEMBERS
  // ================================================================
  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    const result = await this.teamsService.getMembers(id);
    return { success: true, data: result };
  }

  // ================================================================
  // UPDATE MEMBER ROLE
  // ================================================================
  @Patch(':id/members/:userId')
  async updateMemberRole(
    @Request() req: UserRequest,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const result = await this.teamsService.updateMemberRole(req.user.userId, id, userId, dto);
    return { success: true, data: result };
  }

  // ================================================================
  // REMOVE MEMBER
  // ================================================================
  @Delete(':id/members/:userId')
  async removeMember(
    @Request() req: UserRequest,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    const result = await this.teamsService.removeMember(req.user.userId, id, userId);
    return { success: true, data: result };
  }

  // ================================================================
  // JOIN REQUEST (подать заявку)
  // ================================================================
  @Post(':id/join')
  async createJoinRequest(
    @Request() req: UserRequest,
    @Param('id') id: string,
    @Body() dto: CreateJoinRequestDto,
  ) {
    const result = await this.teamsService.createJoinRequest(req.user.userId, id, dto);
    return { success: true, data: result };
  }

  // ================================================================
  // APPROVE JOIN REQUEST
  // ================================================================
  @Post(':id/join/:requestId/approve')
  async approveJoinRequest(
    @Request() req: UserRequest,
    @Param('id') id: string,
    @Param('requestId') requestId: string,
  ) {
    const result = await this.teamsService.approveJoinRequest(req.user.userId, id, requestId);
    return { success: true, data: result };
  }

  // ================================================================
  // REJECT JOIN REQUEST
  // ================================================================
  @Post(':id/join/:requestId/reject')
  async rejectJoinRequest(
    @Request() req: UserRequest,
    @Param('id') id: string,
    @Param('requestId') requestId: string,
  ) {
    const result = await this.teamsService.rejectJoinRequest(req.user.userId, id, requestId);
    return { success: true, data: result };
  }

  // ================================================================
  // LEAVE TEAM
  // ================================================================
  @Post(':id/leave')
  async leave(@Request() req: UserRequest, @Param('id') id: string) {
    const result = await this.teamsService.leave(req.user.userId, id);
    return { success: true, data: result };
  }

  // ================================================================
  // INVITE USER
  // ================================================================
  @Post(':id/invite')
  async invite(
    @Request() req: UserRequest,
    @Param('id') id: string,
    @Body() dto: InviteUserDto,
  ) {
    const result = await this.teamsService.invite(req.user.userId, id, dto);
    return { success: true, data: result };
  }

  // ================================================================
  // ACCEPT INVITE
  // ================================================================
  @Post(':id/invite/:inviteId/accept')
  async acceptInvite(
    @Request() req: UserRequest,
    @Param('id') id: string,
    @Param('inviteId') inviteId: string,
  ) {
    const result = await this.teamsService.acceptInvite(req.user.userId, id, inviteId);
    return { success: true, data: result };
  }

  // ================================================================
  // DECLINE INVITE
  // ================================================================
  @Post(':id/invite/:inviteId/decline')
  async declineInvite(
    @Request() req: UserRequest,
    @Param('id') id: string,
    @Param('inviteId') inviteId: string,
  ) {
    const result = await this.teamsService.declineInvite(req.user.userId, id, inviteId);
    return { success: true, data: result };
  }

  // ================================================================
  // TRANSFER OWNERSHIP
  // ================================================================
  @Post(':id/transfer')
  async transferOwnership(
    @Request() req: UserRequest,
    @Param('id') id: string,
    @Body() dto: TransferOwnershipDto,
  ) {
    const result = await this.teamsService.transferOwnership(req.user.userId, id, dto);
    return { success: true, data: result };
  }

  // ================================================================
  // ACCEPT TRANSFER
  // ================================================================
  @Post(':id/transfer/accept')
  async acceptTransfer(
    @Request() req: UserRequest,
    @Param('id') id: string,
  ) {
    const result = await this.teamsService.acceptTransfer(req.user.userId, id);
    return { success: true, data: result };
  }

  // ================================================================
  // GET HISTORY
  // ================================================================
  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    const result = await this.teamsService.getHistory(id);
    return { success: true, data: result };
  }

  // ================================================================
  // GET MY TEAM
  // ================================================================
  @Get('me/team')
  async getMyTeam(@Request() req: UserRequest) {
    const result = await this.teamsService.getMyTeam(req.user.userId);
    return { success: true, data: result };
  }

  // ================================================================
  // GET MY TEAMS
  // ================================================================
  @Get('my')
  async getMyTeams(@Request() req: UserRequest) {
    const result = await this.teamsService.getMyTeams(req.user.userId);
    return { success: true, data: result };
  }
}
