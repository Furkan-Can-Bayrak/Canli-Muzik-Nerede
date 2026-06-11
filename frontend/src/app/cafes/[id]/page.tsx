"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CafeCoverImage } from "@/components/cafes/CafeCoverImage";
import { IconLocation, IconStorefront } from "@/components/icons/outline";
import { useAuth } from "@/contexts/auth-context";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { apiFetch } from "@/lib/api";

type LocationRef = { id: string; name: string };

type CafeDetail = {
  userId: string;
  name: string;
  address: string;
  description: string | null;
  phone?: string;
  coverUrl?: string | null;
  province: LocationRef;
  district: LocationRef | null;
};

const sectionClass =
  "glass-card rounded-2xl border border-outline-variant/35 p-5 shadow-xl md:p-6";
const sectionTitleClass =
  "text-xs font-semibold uppercase tracking-wider text-secondary/90";

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-card animate-pulse rounded-2xl border border-outline-variant/35 p-8">
        <div className="h-8 w-56 rounded-lg bg-surface-container-high" />
        <div className="mt-3 h-4 w-72 rounded-lg bg-surface-container-high" />
      </div>
    </div>
  );
}

export default function CafeDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { token, ready, user } = useAuth();
  const [cafe, setCafe] = useState<CafeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !ready) return;
    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        try {
          const res = await apiFetch(`/cafes/${id}`, { token });
          if (res.status === 404) {
            if (!cancelled) setError("Mekân bulunamadı.");
            return;
          }
          if (!res.ok) throw new Error();
          const data = (await res.json()) as CafeDetail;
          if (!cancelled) {
            setCafe(data);
            setError(null);
          }
        } catch {
          if (!cancelled) setError("Yüklenemedi.");
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [id, ready, token]);

  const location = cafe
    ? [cafe.province.name, cafe.district?.name].filter(Boolean).join(" · ")
    : "";

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

      <div className="relative mx-auto w-full max-w-3xl space-y-8">
        <Link
          href="/cafes"
          className="inline-flex items-center gap-1 rounded-full border border-outline-variant/50 px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
        >
          ← Tüm mekânlar
        </Link>

        {error ? (
          <div className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
            {error}
            <div className="mt-3">
              <Link
                href="/cafes"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Mekân listesine dön
              </Link>
            </div>
          </div>
        ) : !cafe ? (
          <DetailSkeleton />
        ) : (
          <>
            <div className="relative overflow-hidden rounded-2xl border border-outline-variant/35 shadow-xl">
              <CafeCoverImage
                cafeId={cafe.userId}
                coverUrl={cafe.coverUrl}
                className="aspect-[21/9] w-full object-cover"
              />
            </div>

            <header className={`${sectionClass} space-y-4`}>
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary/15">
                  <IconStorefront className="size-7 text-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={sectionTitleClass}>Mekân</p>
                  <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
                    {cafe.name}
                  </h1>
                  {location ? (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-on-surface-variant">
                      <IconLocation className="size-4 shrink-0" />
                      {location}
                    </p>
                  ) : null}
                </div>
              </div>
            </header>

            <section className={sectionClass}>
              <h2 className={sectionTitleClass}>Adres</h2>
              <p className="mt-3 text-base leading-relaxed text-on-surface">
                {cafe.address}
              </p>
            </section>

            {cafe.description ? (
              <section className={sectionClass}>
                <h2 className={sectionTitleClass}>Hakkında</h2>
                <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-on-surface-variant">
                  {cafe.description}
                </p>
              </section>
            ) : null}

            <section className={sectionClass}>
              <h2 className={sectionTitleClass}>İletişim</h2>
              {cafe.phone ? (
                <p className="mt-3 text-base text-on-surface">
                  <span className="font-medium">Telefon:</span> {cafe.phone}
                </p>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                  İşletme telefonu yalnızca yetkili kullanıcılara gösterilir.
                  Etkinlikler üzerinden mekânı keşfedebilir veya işletme
                  hesabıyla iletişime geçebilirsiniz.
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/?cafeId=${cafe.userId}#explore`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition-transform hover:scale-[0.98]"
                >
                  Etkinliklerini gör
                </Link>
                {user?.role === "CAFE" && user.id === cafe.userId ? (
                  <Link
                    href="/panel/cafe"
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant/50 px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    İşletme panelim
                  </Link>
                ) : !user ? (
                  <Link
                    href="/register"
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant/50 px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    İşletme olarak kayıt
                  </Link>
                ) : null}
              </div>
            </section>

            <ReviewsSection
              targetType="CAFE"
              targetId={cafe.userId}
              token={token}
              userId={user?.id ?? null}
              isOwnProfile={user?.id === cafe.userId}
            />
          </>
        )}
      </div>
    </div>
  );
}
