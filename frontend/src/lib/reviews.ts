import { apiFetch } from "@/lib/api";

export type ReviewTargetType = "BAND" | "CAFE";

export type ReviewItem = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorUserId: string;
};

export type ReviewsResponse = {
  items: ReviewItem[];
  totalCount: number;
  avgRating: number | null;
  summary: string | null;
  myReview: ReviewItem | null;
  skip: number;
  take: number;
};

export async function fetchReviews(
  targetType: ReviewTargetType,
  targetId: string,
  token?: string | null,
  skip = 0,
  take = 20,
): Promise<ReviewsResponse> {
  const qs = new URLSearchParams({
    targetType,
    targetId,
    skip: String(skip),
    take: String(take),
  });
  const res = await apiFetch(`/reviews?${qs}`, { token });
  if (!res.ok) throw new Error("Yorumlar yüklenemedi.");
  return (await res.json()) as ReviewsResponse;
}

export async function createReview(
  token: string,
  payload: {
    targetType: ReviewTargetType;
    targetId: string;
    rating: number;
    body?: string;
  },
): Promise<ReviewItem> {
  const res = await apiFetch("/reviews", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const { formatApiError } = await import("@/lib/errors");
    throw new Error(formatApiError(body) || "Yorum gönderilemedi.");
  }
  return (await res.json()) as ReviewItem;
}

export async function updateReview(
  token: string,
  targetType: ReviewTargetType,
  targetId: string,
  payload: { rating?: number; body?: string },
): Promise<ReviewItem> {
  const qs = new URLSearchParams({ targetType, targetId });
  const res = await apiFetch(`/reviews/me?${qs}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const { formatApiError } = await import("@/lib/errors");
    throw new Error(formatApiError(body) || "Yorum güncellenemedi.");
  }
  return (await res.json()) as ReviewItem;
}
