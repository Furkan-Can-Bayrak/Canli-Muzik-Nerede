import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { matchByName, normalizeLocationName } from '../locations/location-matcher';

type NominatimAddress = {
  state?: string;
  province?: string;
  city?: string;
  town?: string;
  county?: string;
  suburb?: string;
  city_district?: string;
  municipality?: string;
  country?: string;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
};

type GoogleAutocompletePrediction = {
  description: string;
  place_id: string;
};

@Injectable()
export class GeocodingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async reverseGeocode(lat: number, lng: number) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new BadRequestException('Invalid coordinates');
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException('Coordinates out of range');
    }

    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'json');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('accept-language', 'tr');

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'canli-muzik-nerede/1.0 (contact@example.com)',
      },
    });
    if (!res.ok) {
      throw new ServiceUnavailableException('Reverse geocoding failed');
    }

    const data = (await res.json()) as NominatimResult;
    const addr = data.address ?? {};
    const provinceName =
      addr.state ?? addr.province ?? addr.city ?? addr.town ?? null;
    const districtName =
      addr.city_district ??
      addr.county ??
      addr.municipality ??
      addr.suburb ??
      null;

    const matched = await this.matchProvinceDistrict(provinceName, districtName);

    return {
      lat,
      lng,
      displayName: data.display_name,
      provinceName,
      districtName,
      ...matched,
    };
  }

  async matchProvinceDistrict(
    provinceName: string | null | undefined,
    districtName: string | null | undefined,
  ) {
    const provinces = await this.prisma.province.findMany({
      select: { id: true, name: true, plateCode: true },
    });
    const province = matchByName(provinces, provinceName);

    let district: { id: string; name: string } | null = null;
    if (province && districtName) {
      const districts = await this.prisma.district.findMany({
        where: { provinceId: province.id },
        select: { id: true, name: true },
      });
      district = matchByName(districts, districtName);
    }

    return {
      provinceId: province?.id ?? null,
      districtId: district?.id ?? null,
      province: province
        ? {
            id: province.id,
            name: province.name,
            plateCode: province.plateCode,
          }
        : null,
      district: district
        ? { id: district.id, name: district.name }
        : null,
      supported: province != null,
    };
  }

  async placesAutocomplete(q: string, sessionToken?: string) {
    const apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('Google Places is not configured');
    }
    const query = q.trim();
    if (query.length < 2) return [];

    const url = new URL(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json',
    );
    url.searchParams.set('input', query);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('language', 'tr');
    url.searchParams.set('components', 'country:tr');
    url.searchParams.set('types', 'address');
    if (sessionToken) url.searchParams.set('sessiontoken', sessionToken);

    const res = await fetch(url);
    if (!res.ok) {
      throw new ServiceUnavailableException('Places autocomplete failed');
    }
    const body = (await res.json()) as {
      status: string;
      predictions?: GoogleAutocompletePrediction[];
    };
    if (body.status !== 'OK' && body.status !== 'ZERO_RESULTS') {
      throw new ServiceUnavailableException(
        `Places autocomplete error: ${body.status}`,
      );
    }
    return (body.predictions ?? []).map((p) => ({
      description: p.description,
      placeId: p.place_id,
    }));
  }

  async placesDetails(placeId: string, sessionToken?: string) {
    const apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('Google Places is not configured');
    }
    if (!placeId.trim()) throw new BadRequestException('placeId is required');

    const url = new URL(
      'https://maps.googleapis.com/maps/api/place/details/json',
    );
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('language', 'tr');
    url.searchParams.set(
      'fields',
      'formatted_address,geometry,address_component',
    );
    if (sessionToken) url.searchParams.set('sessiontoken', sessionToken);

    const res = await fetch(url);
    if (!res.ok) {
      throw new ServiceUnavailableException('Places details failed');
    }
    const body = (await res.json()) as {
      status: string;
      result?: {
        formatted_address?: string;
        geometry?: { location?: { lat: number; lng: number } };
        address_components?: {
          long_name: string;
          short_name: string;
          types: string[];
        }[];
      };
    };
    if (body.status !== 'OK' || !body.result) {
      throw new BadRequestException('Place not found');
    }

    const components = body.result.address_components ?? [];
    const findComponent = (...types: string[]) =>
      components.find((c) => types.some((t) => c.types.includes(t)))
        ?.long_name;

    const provinceName =
      findComponent('administrative_area_level_1') ??
      findComponent('locality');
    const districtName =
      findComponent('administrative_area_level_2') ??
      findComponent('sublocality', 'sublocality_level_1');

    const matched = await this.matchProvinceDistrict(provinceName, districtName);
    const loc = body.result.geometry?.location;

    return {
      address: body.result.formatted_address ?? '',
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
      provinceName: provinceName ?? null,
      districtName: districtName ?? null,
      ...matched,
      normalizedProvince: provinceName
        ? normalizeLocationName(provinceName)
        : null,
      normalizedDistrict: districtName
        ? normalizeLocationName(districtName)
        : null,
    };
  }
}
