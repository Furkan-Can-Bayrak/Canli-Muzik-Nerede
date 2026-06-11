import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

function roundToInt(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return value;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : value;
}

export class UpdateBandDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  bandName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => roundToInt(value))
  @IsInt()
  @Min(1)
  memberCount?: number;

  @ApiPropertyOptional({ description: 'Only visible to cafes' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Only visible to cafes' })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => roundToInt(value))
  @IsInt()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Replace province ids (whole province coverage)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  provinceIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Replace specific district ids',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  districtIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Replace genre ids' })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  genreIds?: string[];
}
