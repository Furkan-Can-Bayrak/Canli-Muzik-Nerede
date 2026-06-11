import { getApiBaseUrl } from "@/lib/api";
import {
  genreDefaultImageUrl,
  pickGenreForBand,
} from "@/lib/genre-defaults";

export type BandMediaItem = { id: string; type: string; url: string };

export function normalizeMediaUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = getApiBaseUrl();
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

export function normalizeBandMedia(
  items: BandMediaItem[] | undefined,
): BandMediaItem[] {
  return (items ?? []).map((m) => ({ ...m, url: normalizeMediaUrl(m.url) }));
}

type BandGenre = { name: string };

export function bandCoverMedia(
  media: BandMediaItem[] | undefined,
  genres?: BandGenre[],
  bandId?: string,
): { kind: "image"; url: string } | null {
  const img = media?.find((m) => m.type === "IMAGE");
  if (img) return { kind: "image", url: img.url };

  const genre =
    genres && bandId
      ? pickGenreForBand(genres, bandId)
      : genres?.[0] ?? null;
  if (!genre) return null;

  return { kind: "image", url: genreDefaultImageUrl(genre.name) };
}

export async function uploadBandMedia(
  token: string,
  file: File,
  type: "IMAGE" | "VIDEO",
): Promise<BandMediaItem> {
  const { apiUpload } = await import("@/lib/api");
  const res = await apiUpload("/bands/me/media", {
    token,
    formData: () => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      return fd;
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const { formatApiError } = await import("@/lib/errors");
    throw new Error(formatApiError(body) || "Yükleme başarısız.");
  }
  const item = (await res.json()) as BandMediaItem;
  return { ...item, url: normalizeMediaUrl(item.url) };
}
