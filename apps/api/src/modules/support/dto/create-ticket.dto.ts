import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, IsArray } from 'class-validator';

export class CreateTicketDto {
  @IsEmail({}, { message: 'Укажите корректный email' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email!: string;

  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Имя обязательно' })
  @MaxLength(200, { message: 'Имя не может быть длиннее 200 символов' })
  name!: string;

  @IsString({ message: 'Категория должна быть строкой' })
  @IsNotEmpty({ message: 'Категория обязательна' })
  @MaxLength(100, { message: 'Категория не может быть длиннее 100 символов' })
  category!: string;

  @IsString({ message: 'Сообщение должно быть строкой' })
  @IsNotEmpty({ message: 'Сообщение обязательно' })
  message!: string;

  @IsOptional()
  @IsArray({ message: 'Вложения должны быть массивом' })
  attachments?: string[];
}