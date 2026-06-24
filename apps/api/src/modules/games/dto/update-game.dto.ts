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

export class UpdateGameDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  title?: string;

  @IsString()
  @MaxLength(3000)
  @IsOptional()
  description?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  address?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  time?: string; // HH:mm

  @IsNumber()
  @Min(1)
  @IsOptional()
  duration?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxTeams?: number;

  @IsString()
  @IsOptional()
  scenarioId?: string;

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