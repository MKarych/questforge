import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Логин или email должен быть строкой' })
  login!: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен быть длиннее или равен 6 символам' })
  password!: string;
}
