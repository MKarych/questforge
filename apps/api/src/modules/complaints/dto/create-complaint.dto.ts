import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum ComplaintTargetType {
  GAME = 'GAME',
  SCENARIO = 'SCENARIO',
  COMMENT = 'COMMENT',
  REVIEW = 'REVIEW',
  MARKETPLACE_REVIEW = 'MARKETPLACE_REVIEW',
  USER = 'USER',
  TEAM = 'TEAM',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
}

export enum ComplaintReason {
  SPAM = 'SPAM',
  ABUSE = 'ABUSE',
  NSFW = 'NSFW',
  COPYRIGHT = 'COPYRIGHT',
  FRAUD = 'FRAUD',
  HARASSMENT = 'HARASSMENT',
  IMPERSONATION = 'IMPERSONATION',
  FALSE_INFO = 'FALSE_INFO',
  OTHER = 'OTHER',
}

export class CreateComplaintDto {
  @IsEnum(ComplaintTargetType)
  @IsNotEmpty()
  targetType!: ComplaintTargetType;

  @IsString()
  @IsNotEmpty()
  targetId!: string;

  @IsEnum(ComplaintReason)
  @IsNotEmpty()
  reason!: ComplaintReason;

  @IsOptional()
  @IsString()
  description?: string;
}