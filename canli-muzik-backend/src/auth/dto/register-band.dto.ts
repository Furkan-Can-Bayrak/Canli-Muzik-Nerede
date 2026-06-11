import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { RegisterUserBaseDto } from './register-user-base.dto';

function roundToInt(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return value;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : value;
}

export class RegisterBandDto extends RegisterUserBaseDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  bandName!: string;

  @ApiProperty()
  @Type(() => Number)
  @Transform(({ value }) => roundToInt(value))
  @IsInt()
  @Min(1)
  memberCount!: number;

  @ApiProperty({ description: 'Only visible to cafes' })
  @IsString()
  phone!: string;

  @ApiProperty({ description: 'Base price (integer), only visible to cafes' })
  @Type(() => Number)
  @Transform(({ value }) => roundToInt(value))
  @IsInt()
  @Min(0)
  basePrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Province ids where the band plays anywhere in the province',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  provinceIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Specific district ids where the band plays',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  districtIds?: string[];

  @ApiProperty({ type: [String], description: 'Genre ids (many-to-many)' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  genreIds!: string[];
}
