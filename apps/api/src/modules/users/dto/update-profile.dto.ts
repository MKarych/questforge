import { IsString, IsOptional, IsUrl, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(2, { message: 'Имя должно содержать минимум 2 символа' })
  @MaxLength(100, { message: 'Имя не может быть длиннее 100 символов' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'Город должен быть строкой' })
  @MaxLength(100, { message: 'Город не может быть длиннее 100 символов' })
  @IsOptional()
  city?: string;

  @IsString({ message: 'О себе должно быть строкой' })
  @MaxLength(1000, { message: 'О себе не может быть длиннее 1000 символов' })
  @IsOptional()
  bio?: string;

  @IsString({ message: 'Telegram должен быть строкой' })
  @MaxLength(100, { message: 'Telegram не может быть длиннее 100 символов' })
  @IsOptional()
  telegram?: string;

  @IsString({ message: 'VK должен быть строкой' })
  @MaxLength(255, { message: 'VK не может быть длиннее 255 символов' })
  @IsOptional()
  vk?: string;

  @IsString({ message: 'WhatsApp должен быть строкой' })
  @MaxLength(100, { message: 'WhatsApp не может быть длиннее 100 символов' })
  @IsOptional()
  whatsapp?: string;
}
