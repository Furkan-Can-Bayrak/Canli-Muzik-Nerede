"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { IconArrowForward } from "@/components/icons/outline";
import { useAuth } from "@/contexts/auth-context";

type City = { id: string; name: string };
type Genre = { id: string; name: string };

type BandPublic = {
  id: string;
  bandName: string;
  description: string | null;
  cities: City[];
  genres: Genre[];
  media?: { id: string; type: string; url: string }[];
};

function poster(b: BandPublic) {
  const vid = b.media?.find((m) => m.type === "VIDEO");
  if (vid) return { kind: "video" as const, url: vid.url };
  const img = b.media?.find((m) => m.type === "IMAGE");
  if (img) return { kind: "image" as const, url: img.url };
  return null;
}

const GENRE_BADGE = ["primary", "secondary", "tertiary"] as const;

export function FeaturedBands() {
  const { token, ready } = useAuth();
  const [bands, setBands] = useState<BandPublic[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        try {
          const res = await apiFetch("/bands", { token });
          if (!res.ok) throw new Error("Liste alınamadı.");
          const data = (await res.json()) as BandPublic[];
          if (!cancelled) setBands(data.slice(0, 3));
        } catch {
          if (!cancelled) setError("Öne çıkan gruplar yüklenemedi.");
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [ready, token]);

  return (
    <section className="mx-auto max-w-container-max px-margin-mobile py-24 md:px-margin-desktop">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
            Sahne senin
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold text-on-surface md:text-4xl">
            Öne çıkan gruplar
          </h2>
        </div>
        <Link
          href="/bands"
          className="flex items-center gap-2 font-medium text-secondary transition-colors hover:underline"
        >
          Tümünü gör <IconArrowForward className="text-secondary" />
        </Link>
      </div>
      {error ? (
        <p className="rounded-xl border border-error/40 bg-error-container/15 px-4 py-3 text-sm text-error">
          {error}
        </p>
      ) : bands.length === 0 ? (
        <p className="text-center text-base text-on-surface-variant">
          Henüz vitrinde gösterilecek grup yok.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          {bands.map((b, i) => {
            const thumb = poster(b);
            const genre = b.genres[0]?.name ?? "Canlı müzik";
            const badge = GENRE_BADGE[i % GENRE_BADGE.length];
            const badgeBg =
              badge === "primary"
                ? "bg-primary/20 text-primary"
                : badge === "secondary"
                  ? "bg-secondary/20 text-secondary"
                  : "bg-tertiary/20 text-tertiary";
            const cityHint =
              b.cities.length > 0
                ? `${b.cities.map((c) => c.name).join(", ")} bölgesinde.`
                : "Profili görüntüle.";
            return (
              <Link
                key={b.id}
                href={`/bands/${b.id}`}
                className="neon-glow group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-3xl"
              >
                <div className="absolute inset-0 bg-surface-container-high">
                  {thumb?.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb.url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : thumb?.kind === "video" ? (
                    <video
                      src={thumb.url}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/40 via-surface-container-high to-secondary/30" />
                  )}
                </div>
                <div className="gradient-overlay absolute inset-0 flex flex-col justify-end p-8">
                  <span
                    className={`mb-3 w-fit rounded-full px-3 py-1 font-mono text-xs font-medium backdrop-blur-md ${badgeBg}`}
                  >
                    {genre}
                  </span>
                  <h3 className="font-display text-2xl font-semibold text-on-surface">
                    {b.bandName}
                  </h3>
                  <p className="mt-2 text-base text-on-surface-variant opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {b.description?.slice(0, 120) ||
                      `${cityHint} Tanıtım ve videolar için tıkla.`}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
