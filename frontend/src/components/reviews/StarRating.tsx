"use client";

import { useState } from "react";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
  label?: string;
};

function starClass(filled: boolean, interactive: boolean, size: "sm" | "md") {
  const dim = size === "sm" ? "text-base" : "text-xl";
  const base = `${dim} leading-none transition-colors`;
  if (!interactive) {
    return filled ? `${base} text-primary` : `${base} text-outline-variant/40`;
  }
  return filled
    ? `${base} cursor-pointer text-primary`
    : `${base} cursor-pointer text-outline-variant/50`;
}

export function StarRating({
  value,
  onChange,
  size = "md",
  label,
}: StarRatingProps) {
  const interactive = onChange != null;
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {label ? (
        <span className="text-sm font-medium text-on-surface-variant">
          {label}
        </span>
      ) : null}
      <div
        className="flex items-center gap-0.5"
        role={interactive ? "radiogroup" : "img"}
        aria-label={interactive ? "Puan seçin" : `${value} yıldız`}
        onMouseLeave={interactive ? () => setHoverValue(null) : undefined}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= displayValue;
          if (interactive) {
            return (
              <button
                key={star}
                type="button"
                className={starClass(filled, true, size)}
                onClick={() => onChange(star)}
                onMouseEnter={() => setHoverValue(star)}
                aria-label={`${star} yıldız`}
              >
                ★
              </button>
            );
          }
          return (
            <span key={star} className={starClass(filled, false, size)}>
              ★
            </span>
          );
        })}
      </div>
    </div>
  );
}
