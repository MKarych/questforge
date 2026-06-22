import { IsString, MinLength, IsOptional, MaxLength } from 'class-validator';

export class CreateOrganizerApplicationDto {
  @IsString({ message: 'Город должен быть строкой' })
  @MinLength(2, { message: 'Город должен содержать минимум 2 символа' })
  city!: string;

  @IsString({ message: 'Телефон должен быть строкой' })
  @MinLength(10, { message: 'Телефон должен содержать минимум 10 символов' })
  @MaxLength(20, { message: 'Телефон не может быть длиннее 20 символов' })
  phone!: string;

  @IsString({ message: 'Telegram должен быть строкой' })
  @IsOptional()
  @MaxLength(100, { message: 'Telegram не может быть длиннее 100 символов' })
  telegram?: string;

  @IsString({ message: 'Опыт должен быть строкой' })
  @IsOptional()
  experience?: string;
}
