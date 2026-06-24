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
    return this.teamsService.create(req.user.userId, dto);
  }

  // ================================================================
  // FIND ALL (public)
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
    return this.teamsService.findAll({
      city,
      search,
      status: status as any,
      tags: tags ? tags.split(',') : undefined,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });
  }

  // ================================================================
  // GET MY TEAM (static routes MUST be before :id)
  // ================================================================
  @Get('me/team')
  async getMyTeam(@Request() req: UserRequest) {
    return this.teamsService.getMyTeam(req.user.userId);
  }

  // ================================================================
  // GET MY TEAMS
  // ================================================================
  @Get('my')
  async getMyTeams(@Request() req: UserRequest) {
    return this.teamsService.getMyTeams(req.user.userId);
  }

  // ================================================================
  // FIND ONE (public)
  // ================================================================
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  // ================================================================
  // FIND PRIVATE (for members)
  // ================================================================
  @Get(':id/private')
  async findPrivate(@Request() req: UserRequest, @Param('id') id: string) {
    return this.teamsService.findPrivate(id, req.user.userId);
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
    return this.teamsService.update(req.user.userId, id, dto);
  }

  // ================================================================
  // DELETE (Soft Delete)
  // ================================================================
  @Delete(':id')
  async delete(@Request() req: UserRequest, @Param('id') id: string) {
    return this.teamsService.delete(req.user.userId, id);
  }

  // ================================================================
  // GET MEMBERS
  // ================================================================
  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    return this.teamsService.getMembers(id);
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
    return this.teamsService.updateMemberRole(req.user.userId, id, userId, dto);
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
    return this.teamsService.removeMember(req.user.userId, id, userId);
  }

  // ================================================================
  // JOIN REQUEST (подать заявку)
  // ================================================================
  @Post(':id/join')
  @Post(':id/join-request')
  async createJoinRequest(
    @Request() req: UserRequest,
    @Param('id') id: string,
    @Body() dto: CreateJoinRequestDto,
  ) {
    return this.teamsService.createJoinRequest(req.user.userId, id, dto);
  }

  // ================================================================
  // APPROVE JOIN REQUEST
  // ================================================================
  @Post(':id/join/:requestId/approve')
  @Post(':id/join-request/:requestId/approve')
  async approveJoinRequest(
    @Request() req: UserRequest,
    @Param('id') id: string,
    @Param('requestId') requestId: string,
  ) {
    return this.teamsService.approveJoinRequest(req.user.userId, id, requestId);
  }

  // ================================================================
  // REJECT JOIN REQUEST
  // ================================================================
  @Post(':id/join/:requestId/reject')
  @Post(':id/join-request/:requestId/reject')
  async rejectJoinRequest(
    @Request() req: UserRequest,
    @Param('id') id: string,
    @Param('requestId') requestId: string,
  ) {
    return this.teamsService.rejectJoinRequest(req.user.userId, id, requestId);
  }

  // ================================================================
  // LEAVE TEAM
  // ================================================================
  @Post(':id/leave')
  async leave(@Request() req: UserRequest, @Param('id') id: string) {
    return this.teamsService.leave(req.user.userId, id);
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
    return this.teamsService.invite(req.user.userId, id, dto);
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
    return this.teamsService.acceptInvite(req.user.userId, id, inviteId);
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
    return this.teamsService.declineInvite(req.user.userId, id, inviteId);
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
    return this.teamsService.transferOwnership(req.user.userId, id, dto);
  }

  // ================================================================
  // ACCEPT TRANSFER
  // ================================================================
  @Post(':id/transfer/accept')
  async acceptTransfer(
    @Request() req: UserRequest,
    @Param('id') id: string,
  ) {
    return this.teamsService.acceptTransfer(req.user.userId, id);
  }

  // ================================================================
  // GET HISTORY
  // ================================================================
  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return this.teamsService.getHistory(id);
  }
}
