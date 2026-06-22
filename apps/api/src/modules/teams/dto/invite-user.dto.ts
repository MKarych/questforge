import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class InviteUserDto {
  @IsNotEmpty()
  @IsUUID()
  userId!: string;
}
