"use client";

import { useEffect, useState } from "react";
import { cafeDefaultImageUrl } from "@/lib/cafe-defaults";
import { cafeHasCover, normalizeCoverUrl } from "@/lib/cafe-cover";

type CafeCoverImageProps = {
  cafeId: string;
  coverUrl?: string | null;
  className?: string;
};

export function CafeCoverImage({
  cafeId,
  coverUrl,
  className = "absolute inset-0 size-full object-cover",
}: CafeCoverImageProps) {
  const fallback = cafeDefaultImageUrl(cafeId);
  const custom = cafeHasCover(coverUrl)
    ? normalizeCoverUrl(coverUrl!)
    : null;
  const [src, setSrc] = useState(custom ?? fallback);

  useEffect(() => {
    setSrc(custom ?? fallback);
  }, [custom, fallback]);

  function useFallback() {
    setSrc((current) => (current === fallback ? current : fallback));
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={className}
      onError={useFallback}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (
          custom &&
          src !== fallback &&
          (img.naturalWidth < 32 || img.naturalHeight < 32)
        ) {
          useFallback();
        }
      }}
    />
  );
}
