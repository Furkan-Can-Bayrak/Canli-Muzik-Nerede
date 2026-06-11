import { getApiBaseUrl } from "@/lib/api";

/** DB tür adı → backend /genres/ altındaki webp dosyası */
export const GENRE_DEFAULT_IMAGES: Record<string, string> = {
  Rock: "rock.webp",
  Caz: "caz.webp",
  Akustik: "akustik.webp",
  Elektronik: "elektronik.webp",
  "Türk Halk Müziği": "turk-halk-muzigi.webp",
  "Türk Sanat Müziği": "turk-sanat-muzigi.webp",
  Blues: "blues.webp",
  Soul: "soul.webp",
  Alternatif: "alternatif.webp",
};

const FALLBACK_FILE = "default.webp";

export function genreDefaultImageUrl(genreName: string): string {
  const file = GENRE_DEFAULT_IMAGES[genreName] ?? FALLBACK_FILE;
  return `${getApiBaseUrl()}/genres/${file}`;
}

/** Grup kimliğine göre sabit tür seçimi (her render’da değişmez). */
export function pickGenreForBand<T extends { name: string }>(
  genres: T[],
  bandId: string,
): T | null {
  if (genres.length === 0) return null;
  let hash = 0;
  for (let i = 0; i < bandId.length; i++) {
    hash = (hash + bandId.charCodeAt(i) * (i + 1)) >>> 0;
  }
  return genres[hash % genres.length] ?? genres[0];
}
