import { IsNotEmpty, IsString, MaxLength, MinLength, IsOptional } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @MinLength(2)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
