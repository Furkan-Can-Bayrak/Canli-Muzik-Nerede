export type Province = {
  id: string;
  plateCode: string;
  name: string;
};

export type District = {
  id: string;
  name: string;
  provinceId: string;
};

export type ReverseGeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
  provinceName: string | null;
  districtName: string | null;
  provinceId: string | null;
  districtId: string | null;
  province: { id: string; name: string; plateCode: string } | null;
  district: { id: string; name: string } | null;
  supported: boolean;
};

export type PlacesSuggestion = {
  description: string;
  placeId: string;
};

export type PlaceDetailsResult = ReverseGeocodeResult & {
  address: string;
};

export type BusinessAddressValue = {
  address: string;
  provinceId: string;
  districtId: string | null;
  latitude: number | null;
  longitude: number | null;
};
