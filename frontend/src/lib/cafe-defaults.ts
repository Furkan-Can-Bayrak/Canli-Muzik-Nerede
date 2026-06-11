import { getApiBaseUrl } from "@/lib/api";

/** Kapaksız mekânlar için backend static/cafes/default.webp */
const CAFE_DEFAULT_FILE = "default.webp";

export function cafeDefaultImageUrl(_cafeId?: string): string {
  return `${getApiBaseUrl()}/static/cafes/${CAFE_DEFAULT_FILE}`;
}
