import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { GeocodingService } from './geocoding.service';

class ReverseQuery {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}

class AutocompleteQuery {
  @IsString()
  q!: string;

  @IsOptional()
  @IsString()
  sessionToken?: string;
}

class DetailsQuery {
  @IsString()
  placeId!: string;

  @IsOptional()
  @IsString()
  sessionToken?: string;
}

@ApiTags('geocoding')
@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly geocoding: GeocodingService) {}

  @Get('reverse')
  reverse(@Query() q: ReverseQuery) {
    return this.geocoding.reverseGeocode(q.lat, q.lng);
  }

  @Get('places/autocomplete')
  autocomplete(@Query() q: AutocompleteQuery) {
    return this.geocoding.placesAutocomplete(q.q, q.sessionToken);
  }

  @Get('places/details')
  details(@Query() q: DetailsQuery) {
    return this.geocoding.placesDetails(q.placeId, q.sessionToken);
  }
}
