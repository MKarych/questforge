import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { TeamRole } from '../types/team-types';

export class UpdateMemberRoleDto {
  @IsNotEmpty()
  @IsEnum(TeamRole)
  role!: TeamRole;
}