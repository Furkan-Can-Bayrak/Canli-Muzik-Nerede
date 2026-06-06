import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { RegisterUserBaseDto } from './register-user-base.dto';

export class RegisterCafeDto extends RegisterUserBaseDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ description: 'Province (il) id' })
  @IsUUID()
  provinceId!: string;

  @ApiPropertyOptional({ description: 'District (ilçe) id' })
  @IsOptional()
  @IsUUID()
  districtId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  address!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
