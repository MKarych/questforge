import { IsString, IsUUID } from 'class-validator';

export class InviteUserDto {
  @IsString()
  @IsUUID()
  userId: string;
}
