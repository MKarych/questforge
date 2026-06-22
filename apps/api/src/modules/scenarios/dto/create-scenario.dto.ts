import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateScenarioDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  nodes!: any[];

  @IsString()
  startNodeId!: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  licenseType?: string;
}
