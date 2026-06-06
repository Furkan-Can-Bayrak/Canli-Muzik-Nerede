import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateBandDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  bandName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  memberCount?: number;

  @ApiPropertyOptional({ description: 'Only visible to cafes' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Only visible to cafes' })
  @IsOptional()
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
