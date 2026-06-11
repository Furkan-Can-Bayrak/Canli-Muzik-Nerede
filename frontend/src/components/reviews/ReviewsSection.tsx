"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchReviews,
  type ReviewTargetType,
  type ReviewsResponse,
} from "@/lib/reviews";
import { ReviewForm } from "./ReviewForm";
import { ReviewList } from "./ReviewList";
import { ReviewSummaryCard } from "./ReviewSummaryCard";
import { StarRating } from "./StarRating";

type ReviewsSectionProps = {
  targetType: ReviewTargetType;
  targetId: string;
  token: string | null;
  userId: string | null;
  isOwnProfile: boolean;
};

export function ReviewsSection({
  targetType,
  targetId,
  token,
  userId,
  isOwnProfile,
}: ReviewsSectionProps) {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchReviews(targetType, targetId, token);
      setData(res);
      setError(null);
    } catch {
      setError("Yorumlar yüklenemedi.");
    }
  }, [targetType, targetId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-primary/90">
          Yorumlar
        </h2>
        {data ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {data.avgRating != null ? (
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl font-bold text-on-surface">
                  {data.avgRating.toFixed(1)}
                </span>
                <StarRating value={Math.round(data.avgRating)} size="sm" />
              </div>
            ) : null}
            <span className="text-sm text-on-surface-variant">
              {data.totalCount} yorum
            </span>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      {data?.summary ? <ReviewSummaryCard summary={data.summary} /> : null}

      <div className="glass-card rounded-2xl border border-outline-variant/35 p-5 shadow-xl md:p-6">
        <ReviewForm
          targetType={targetType}
          targetId={targetId}
          token={token}
          userId={userId}
          isOwnProfile={isOwnProfile}
          myReview={data?.myReview ?? null}
          onSaved={() => void load()}
        />
      </div>

      {data ? <ReviewList items={data.items} /> : null}
    </section>
  );
}
