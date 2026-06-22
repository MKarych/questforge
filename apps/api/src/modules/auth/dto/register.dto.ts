import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Некорректный формат email' })
  email!: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен быть длиннее или равен 6 символам' })
  password!: string;

  @IsString({ message: 'Имя должно быть строкой' })
  name!: string;
}
