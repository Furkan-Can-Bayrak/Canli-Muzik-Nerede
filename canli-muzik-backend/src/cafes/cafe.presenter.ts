export type CafeWithLocation = {
  userId: string;
  name: string;
  provinceId: string;
  districtId: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  description: string | null;
  coverUrl?: string | null;
  province: { id: string; name: string; plateCode?: string };
  district: { id: string; name: string } | null;
};

export function presentCafe(
  cafe: CafeWithLocation,
  canSeePhone: boolean,
): Record<string, unknown> {
  return {
    userId: cafe.userId,
    name: cafe.name,
    provinceId: cafe.provinceId,
    districtId: cafe.districtId,
    address: cafe.address,
    latitude: cafe.latitude,
    longitude: cafe.longitude,
    description: cafe.description,
    coverUrl: cafe.coverUrl ?? null,
    province: cafe.province,
    district: cafe.district,
    /** @deprecated use province */
    cityId: cafe.provinceId,
    /** @deprecated use province */
    city: { id: cafe.province.id, name: cafe.province.name },
    phone: canSeePhone ? cafe.phone : undefined,
  };
}
