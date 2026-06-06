import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class ListEventsQuery {
  @ApiPropertyOptional({ description: 'Province (il) id' })
  @IsOptional()
  @IsUUID()
  provinceId?: string;

  /** @deprecated Use provinceId */
  @ApiPropertyOptional({ description: 'Alias for provinceId' })
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @ApiPropertyOptional({ description: 'District (ilçe) id' })
  @IsOptional()
  @IsUUID()
  districtId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bandId?: string;

  @ApiPropertyOptional({ description: 'Filter by publishing cafe user id' })
  @IsOptional()
  @IsUUID()
  cafeId?: string;

  @ApiPropertyOptional({
    description: 'Case-insensitive contains on event address',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressContains?: string;

  @ApiPropertyOptional({
    description:
      'Search in event address or cafe name (case-insensitive, public listing)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'ISO date-time' })
  @IsOptional()
  @IsISO8601()
  startAtFrom?: string;

  @ApiPropertyOptional({ description: 'ISO date-time' })
  @IsOptional()
  @IsISO8601()
  startAtTo?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}
