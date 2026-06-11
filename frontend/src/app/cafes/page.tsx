"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CafeCoverImage } from "@/components/cafes/CafeCoverImage";
import { apiFetch } from "@/lib/api";
import { formatFetchError } from "@/lib/errors";
import { useAuth } from "@/contexts/auth-context";

type LocationRef = { id: string; name: string };

type CafePublic = {
  userId: string;
  name: string;
  address: string;
  description: string | null;
  coverUrl?: string | null;
  province: LocationRef;
  district: LocationRef | null;
};

function formatLocation(cafe: CafePublic): string {
  const parts = [cafe.province.name];
  if (cafe.district) parts.push(cafe.district.name);
  return parts.join(" · ");
}

function CafesSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <li
          key={i}
          className="aspect-[4/5] animate-pulse rounded-3xl border border-outline-variant/35 bg-surface-container-high"
        />
      ))}
    </ul>
  );
}

export default function CafesDirectoryPage() {
  const { token, ready } = useAuth();
  const [cafes, setCafes] = useState<CafePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        try {
          const res = await apiFetch("/cafes", { token });
          if (!res.ok) throw new Error("Mekanlar yüklenemedi.");
          const data = (await res.json()) as CafePublic[];
          if (!cancelled) setCafes(data);
        } catch (err) {
          if (!cancelled) setError(formatFetchError(err));
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [ready, token]);

  return (
    <div className="relative min-h-[calc(100vh-10rem)] overflow-hidden px-margin-mobile py-10 md:px-margin-desktop md:py-14">
      <div
        className="pointer-events-none absolute -left-20 top-16 size-72 rounded-full bg-primary/10 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-10 size-72 rounded-full bg-secondary/10 blur-[100px]"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-container-max space-y-10">
        <header className="max-w-2xl">
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-secondary">
            Canlı müzik mekânları
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-on-surface md:text-5xl">
            Mekanlar
          </h1>
          <p className="mt-4 text-base leading-relaxed text-on-surface-variant">
            Canlı müzik düzenleyen işletmeleri keşfedin. Etkinlikleri ve
            iletişim bilgilerini profillerinden inceleyebilirsiniz.
          </p>
        </header>

        {error ? (
          <p className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
            {error}
          </p>
        ) : null}

        {loading ? (
          <CafesSkeleton />
        ) : cafes.length === 0 && !error ? (
          <div className="glass-card rounded-2xl border border-dashed border-outline-variant/40 px-6 py-16 text-center">
            <p className="font-display text-lg font-semibold text-on-surface">
              Henüz kayıtlı mekân yok
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              İşletme hesabıyla kayıt olan mekânlar burada listelenecek.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-transform hover:scale-[0.98]"
            >
              İşletme olarak kayıt ol
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cafes.map((cafe) => {
              const location = formatLocation(cafe);
              const subtitle =
                cafe.description?.slice(0, 100) ||
                cafe.address.slice(0, 80);
              return (
                <li key={cafe.userId}>
                  <Link
                    href={`/cafes/${cafe.userId}`}
                    className="neon-glow group relative block aspect-[4/5] overflow-hidden rounded-3xl"
                  >
                    <CafeCoverImage
                      cafeId={cafe.userId}
                      coverUrl={cafe.coverUrl}
                      className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="gradient-overlay absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                      <span className="mb-3 w-fit rounded-full bg-secondary/20 px-3 py-1 font-mono text-xs font-medium text-secondary backdrop-blur-md">
                        {location}
                      </span>
                      <h2 className="font-display text-2xl font-semibold text-on-surface">
                        {cafe.name}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant opacity-90 transition-opacity duration-300 group-hover:opacity-100">
                        {subtitle}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
