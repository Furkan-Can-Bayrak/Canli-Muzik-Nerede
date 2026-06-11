"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  createReview,
  updateReview,
  type ReviewItem,
  type ReviewTargetType,
} from "@/lib/reviews";
import { StarRating } from "./StarRating";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-outline-variant/40 bg-surface-container/60 px-4 py-2.5 font-sans text-base text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-y";

type ReviewFormProps = {
  targetType: ReviewTargetType;
  targetId: string;
  token: string | null;
  userId: string | null;
  isOwnProfile: boolean;
  myReview: ReviewItem | null;
  onSaved: () => void;
};

export function ReviewForm({
  targetType,
  targetId,
  token,
  userId,
  isOwnProfile,
  myReview,
  onSaved,
}: ReviewFormProps) {
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [body, setBody] = useState(myReview?.body ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRating(myReview?.rating ?? 0);
    setBody(myReview?.body ?? "");
  }, [myReview]);

  if (!userId) {
    return (
      <p className="rounded-xl border border-outline-variant/35 bg-surface-container-low/40 px-4 py-3 text-sm text-on-surface-variant">
        Yorum yapmak için{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          giriş yapın
        </Link>
        .
      </p>
    );
  }

  if (isOwnProfile) {
    return (
      <p className="rounded-xl border border-outline-variant/35 bg-surface-container-low/40 px-4 py-3 text-sm text-on-surface-variant">
        Kendi profilinize yorum yazamazsınız.
      </p>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (rating < 1) {
      setError("Lütfen 1 ile 5 arasında puan verin.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (myReview) {
        await updateReview(token, targetType, targetId, {
          rating,
          body: body.trim() || undefined,
        });
      } else {
        await createReview(token, {
          targetType,
          targetId,
          rating,
          body: body.trim() || undefined,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <StarRating
        value={rating}
        onChange={setRating}
        label={myReview ? "Puanınızı güncelleyin" : "Puanınız"}
      />
      <div>
        <label
          htmlFor="review-body"
          className="block text-sm font-medium text-on-surface-variant"
        >
          Yorumunuz (isteğe bağlı)
        </label>
        <textarea
          id="review-body"
          rows={3}
          maxLength={1000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={inputClass}
          placeholder="Deneyiminizi paylaşın…"
        />
      </div>
      {error ? (
        <p className="text-sm text-error">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-transform hover:scale-[0.98] disabled:opacity-50"
      >
        {pending
          ? "Kaydediliyor…"
          : myReview
            ? "Yorumu güncelle"
            : "Yorumu gönder"}
      </button>
    </form>
  );
}
