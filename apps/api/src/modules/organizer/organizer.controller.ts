import { Controller, Get, Post, Patch, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { CreateOrganizerApplicationDto } from './dto/create-organizer-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRequest } from '../../common/types/user-request.type';

@Controller('organizer')
@UseGuards(JwtAuthGuard)
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Post('apply')
  async apply(@Request() req: UserRequest, @Body() dto: CreateOrganizerApplicationDto) {
    return this.organizerService.apply(req.user.userId, dto);
  }

  @Get('status')
  async getStatus(@Request() req: UserRequest) {
    return this.organizerService.getStatus(req.user.userId);
  }

  @Get('admin/applications')
  @Roles('ADMIN', 'MODERATOR')
  @UseGuards(RolesGuard)
  async findAllApplications() {
    return this.organizerService.findAllApplications();
  }

  @Patch('admin/applications/:id/review')
  @Roles('ADMIN', 'MODERATOR')
  @UseGuards(RolesGuard)
  async reviewApplication(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string },
    @Request() req: UserRequest,
  ) {
    return this.organizerService.reviewApplication(id, body.status, body.rejectionReason, req.user.userId);
  }
}
