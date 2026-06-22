import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateGameDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  city!: string;

  @IsDateString()
  date!: string;

  @IsNumber()
  duration!: number;

  @IsNumber()
  price!: number;

  @IsNumber()
  maxTeams!: number;

  @IsString()
  @IsOptional()
  scenarioId?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
