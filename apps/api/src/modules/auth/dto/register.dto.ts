import { IsEmail, IsString, MinLength, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Логин должен быть строкой' })
  @MinLength(3, { message: 'Логин должен содержать минимум 3 символа' })
  username!: string;

  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(1, { message: 'Имя не может быть пустым' })
  name!: string;

  @IsEmail({}, { message: 'Некорректный формат email' })
  email!: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен быть длиннее или равен 6 символам' })
  password!: string;

  @IsBoolean({ message: 'Необходимо согласиться с условиями' })
  agreeToTerms!: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'Ответ капчи должен быть числом' })
  captchaAnswer?: number;
}
