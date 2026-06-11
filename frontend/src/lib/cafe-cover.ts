import { apiFetch, getApiBaseUrl } from "@/lib/api";
import { cafeDefaultImageUrl } from "@/lib/cafe-defaults";

export function cafeHasCover(coverUrl?: string | null): boolean {
  return Boolean(coverUrl?.trim());
}

export function resolveCafeCoverUrl(
  cafeId: string,
  coverUrl?: string | null,
  useFallback = false,
): string {
  if (!useFallback && cafeHasCover(coverUrl)) {
    return normalizeCoverUrl(coverUrl!);
  }
  return cafeDefaultImageUrl(cafeId);
}

export function normalizeCoverUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = getApiBaseUrl();
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

export async function uploadCafeCover(
  token: string,
  file: File,
): Promise<string> {
  const { apiUpload } = await import("@/lib/api");
  const res = await apiUpload("/cafes/me/cover", {
    token,
    formData: () => {
      const fd = new FormData();
      fd.append("file", file);
      return fd;
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const { formatApiError } = await import("@/lib/errors");
    throw new Error(formatApiError(body) || "Kapak görseli yüklenemedi.");
  }
  const data = (await res.json()) as { coverUrl: string };
  return normalizeCoverUrl(data.coverUrl);
}

export async function removeCafeCover(token: string): Promise<void> {
  const res = await apiFetch("/cafes/me/cover", {
    method: "DELETE",
    token,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const { formatApiError } = await import("@/lib/errors");
    throw new Error(formatApiError(body) || "Kapak görseli kaldırılamadı.");
  }
}
