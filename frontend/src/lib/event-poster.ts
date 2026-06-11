import { apiFetch, getApiBaseUrl } from "@/lib/api";

export function normalizePosterUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = getApiBaseUrl();
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

export async function uploadEventPoster(
  token: string,
  eventId: string,
  file: File,
): Promise<string> {
  const { apiUpload } = await import("@/lib/api");
  const res = await apiUpload(`/events/${eventId}/poster`, {
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
  const data = (await res.json()) as { posterUrl: string };
  return normalizePosterUrl(data.posterUrl);
}

export async function removeEventPoster(
  token: string,
  eventId: string,
): Promise<void> {
  const res = await apiFetch(`/events/${eventId}/poster`, {
    method: "DELETE",
    token,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const { formatApiError } = await import("@/lib/errors");
    throw new Error(formatApiError(body) || "Kapak görseli kaldırılamadı.");
  }
}
