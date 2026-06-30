import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ModerationAction {
  SOFT = 'soft',
  HARD = 'hard',
}

export class ModerateComplaintDto {
  @IsEnum(ModerationAction)
  action!: ModerationAction;

  @IsOptional()
  @IsString()
  moderationNote?: string;
}