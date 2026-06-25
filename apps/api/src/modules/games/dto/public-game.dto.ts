import { GameStatus } from '@prisma/client';

/**
 * Публичное DTO для игроков (без чувствительных данных).
 */
export class PublicGameDto {
  id!: string;
  slug!: string;
  title!: string;
  description!: string | null;
  city!: string;
  address!: string | null;
  date!: Date;
  time!: string;
  duration!: number;
  price!: number;
  maxTeams!: number;
  imageUrl!: string | null;
  bannerUrl!: string | null;
  tags!: string[];
  status!: GameStatus;
  shareLink!: string;
  scenarioId!: string | null;
  startedAt!: Date | null;
  finishedAt!: Date | null;
  createdAt!: Date;
  teamsCount!: number;
  rating!: number;
  reviewsCount!: number;
}