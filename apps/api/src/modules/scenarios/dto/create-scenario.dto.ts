import { IsString, IsOptional, IsArray, IsNumber, ValidateIf } from 'class-validator';

export class CreateScenarioDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  nodes?: any[];

  @ValidateIf((o: CreateScenarioDto) => !o.nodes || o.nodes.length === 0)
  @IsString()
  startNodeId!: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  licenseType?: string;
}
