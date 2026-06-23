import { IsString, IsOptional, IsArray, IsNumber, ValidateIf } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateScenarioDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  nodes?: any[];

  @ValidateIf((o: CreateScenarioDto) => !o.nodes || (Array.isArray(o.nodes) && o.nodes.length === 0))
  @IsString()
  startNodeId!: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  licenseType?: string;
}
