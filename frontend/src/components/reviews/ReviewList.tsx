import type { ReviewItem } from "@/lib/reviews";
import { StarRating } from "./StarRating";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function ReviewList({ items }: { items: ReviewItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low/40 px-6 py-8 text-center text-sm text-on-surface-variant">
        Henüz yorum yok. İlk yorumu siz yazın.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((r) => (
        <li
          key={r.id}
          className="rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-on-surface">{r.authorName}</span>
            <span className="text-xs text-on-surface-variant">
              {formatDate(r.createdAt)}
            </span>
          </div>
          <div className="mt-2">
            <StarRating value={r.rating} size="sm" />
          </div>
          {r.body?.trim() ? (
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              {r.body}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
