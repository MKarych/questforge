import { IsString, IsOptional } from 'class-validator';

export class UploadCoverDto {
  @IsString()
  @IsOptional()
  gameId?: string;
}
