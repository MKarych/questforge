import {
  IsOptional, IsString, MaxLength, IsEnum, IsArray, IsNumber, Min, Max,
} from 'class-validator';
import { TeamVisibility, JoinPolicy, TeamStatus } from '../types/team-types';

export class UpdateTeamDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  avatar?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  banner?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  website?: string;

  @IsOptional()
  socials?: Record<string, string>;

  @IsEnum(TeamVisibility)
  @IsOptional()
  privacy?: TeamVisibility;

  @IsEnum(TeamStatus)
  @IsOptional()
  status?: TeamStatus;

  @IsEnum(JoinPolicy)
  @IsOptional()
  joinPolicy?: JoinPolicy;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  maxMembers?: number;
}