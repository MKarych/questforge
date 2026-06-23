import { IsString, IsOptional, IsArray, IsNumber, ValidateIf, IsObject } from 'class-validator';
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
  edges?: any[];

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
  metadata?: Record<string, any>;

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
