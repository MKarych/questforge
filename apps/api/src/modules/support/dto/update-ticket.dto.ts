import { IsOptional, IsString } from 'class-validator';

export class UpdateTicketDto {
  @IsOptional()
  @IsString({ message: 'Статус должен быть строкой' })
  status?: string;

  @IsOptional()
  @IsString({ message: 'Ответ должен быть строкой' })
  response?: string;
}