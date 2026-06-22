import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @IsUUID()
  gameId!: string;

  @IsString()
  teamName!: string;

  @IsString()
  @IsOptional()
  playerName?: string;
}
