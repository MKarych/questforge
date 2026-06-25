import { GameStatus } from '@prisma/client';
import { PrivateGameDto } from './private-game.dto';

/**
 * Admin DTO для админа/модератора (все данные + аудит).
 */
export class AdminGameDto extends PrivateGameDto {
  deletedAt!: Date | null;
  organizerEmail!: string;
  organizerUsername!: string;
  scenarioName!: string | null;
}