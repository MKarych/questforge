import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
  Min,
  MaxLength,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';

export class CreateGameDto {
  @IsString()
  @MaxLength(100)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(3000)
  description?: string;

  @IsString()
  @MaxLength(100)
  city!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @IsDateString()
  date!: string;

  @IsString()
  time!: string; // HH:mm

  @IsNumber()
  @Min(1)
  duration!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(1)
  maxTeams!: number;

  @IsString()
  @IsOptional()
  scenarioId?: string;

  @IsString()
  @IsOptional()
  scenarioListingId?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  tags?: string[];

  // Настройки старта
  @IsBoolean()
  @IsOptional()
  autoStart?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  autoStartDelay?: number;

  @IsBoolean()
  @IsOptional()
  allowEarlyStart?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  startBuffer?: number;

  @IsBoolean()
  @IsOptional()
  allowLateRegistration?: boolean;
}
