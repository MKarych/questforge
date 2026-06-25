import { GameStatus } from '@prisma/client';
import { PublicGameDto } from './public-game.dto';

/**
 * Приватное DTO для организатора (все данные игры + статусы команд).
 */
export class PrivateGameDto extends PublicGameDto {
  moderationComment!: string | null;
  version!: number;
  autoStart!: boolean;
  autoStartDelay!: number;
  allowEarlyStart!: boolean;
  startBuffer!: number;
  allowLateRegistration!: boolean;
  organizerId!: string;
  publishedAt!: Date | null;
  updatedAt!: Date;
  teams!: {
    teamId: string;
    teamName: string;
    status: string;
    readyAt: Date | null;
  }[];
}