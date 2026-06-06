import type { Role } from '@prisma/client';

type BandWithRelations = {
  userId: string;
  bandName: string;
  memberCount: number;
  phone: string;
  basePrice: number;
  description: string | null;
  provinces: { province: { id: string; name: string } }[];
  districts: {
    district: {
      id: string;
      name: string;
      provinceId: string;
      province: { id: string; name: string };
    };
  }[];
  genres: { genre: { id: string; name: string } }[];
  media: { id: string; type: 'IMAGE' | 'VIDEO'; url: string; createdAt: Date }[];
};

export function presentBand(
  band: BandWithRelations,
  viewerRole?: Role,
  viewerUserId?: string,
): Record<string, unknown> {
  const canSeePrivate =
    viewerRole === 'CAFE' ||
    (viewerRole === 'BAND' && viewerUserId === band.userId);

  const provinces = band.provinces.map((p) => p.province);
  const districts = band.districts.map((d) => ({
    id: d.district.id,
    name: d.district.name,
    provinceId: d.district.provinceId,
    provinceName: d.district.province.name,
  }));

  return {
    id: band.userId,
    bandName: band.bandName,
    memberCount: band.memberCount,
    description: band.description,
    provinces,
    districts,
    /** @deprecated use provinces */
    cities: provinces,
    genres: band.genres.map((g) => g.genre),
    media: band.media,
    phone: canSeePrivate ? band.phone : undefined,
    basePrice: canSeePrivate ? band.basePrice : undefined,
  };
}
