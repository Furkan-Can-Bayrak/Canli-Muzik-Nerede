"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconCalendar,
  IconChevronRight,
  IconLocation,
  IconMusicNote,
  IconStorefront,
} from "@/components/icons/outline";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";

type LocationRef = { id: string; name: string };

type ApiEvent = {
  id: string;
  title: string | null;
  address: string;
  description: string | null;
  startAt: string | null;
  endAt: string | null;
  price: number | null;
  posterUrl: string | null;
  province: LocationRef;
  district: LocationRef | null;
  city?: LocationRef;
  cafe: {
    userId: string;
    name: string;
    address: string;
    description?: string | null;
    phone?: string | null;
    province: LocationRef;
    district: LocationRef | null;
    city?: LocationRef;
  };
  band: {
    userId: string;
    bandName: string;
    memberCount: number;
    description: string | null;
  } | null;
};

const sectionClass =
  "glass-card rounded-2xl border border-outline-variant/35 p-5 shadow-xl md:p-6";
const sectionTitleClass =
  "text-xs font-semibold uppercase tracking-wider text-secondary/90";

function formatWhen(iso: string | null) {
  if (!iso) return "Tarih henüz belirtilmedi";
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-card aspect-[21/9] animate-pulse rounded-2xl border border-outline-variant/35 bg-surface-container-high" />
      <div className="glass-card animate-pulse rounded-2xl border border-outline-variant/35 p-8">
        <div className="h-8 w-64 rounded-lg bg-surface-container-high" />
        <div className="mt-3 h-4 w-48 rounded-lg bg-surface-container-high" />
        <div className="mt-6 h-12 w-32 rounded-xl bg-surface-container-high" />
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { token, ready } = useAuth();
  const [ev, setEv] = useState<ApiEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !ready) return;
    let cancelled = false;
    void (async () => {
      setError(null);
      try {
        const res = await apiFetch(`/events/${id}`, { token });
        if (res.status === 404) {
          if (!cancelled) setError("Etkinlik bulunamadı.");
          return;
        }
        if (!res.ok) throw new Error("Etkinlik yüklenemedi.");
        const data = (await res.json()) as ApiEvent;
        if (!cancelled) setEv(data);
      } catch {
        if (!cancelled) setError("Bir hata oluştu.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, token, ready]);

  const locationLabel = ev
    ? [ev.province.name, ev.district?.name].filter(Boolean).join(" · ")
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

      <div className="relative mx-auto w-full max-w-3xl space-y-6">
        <Link
          href="/events"
          className="inline-flex items-center gap-1 rounded-full border border-outline-variant/50 px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
        >
          ← Tüm etkinlikler
        </Link>

        {error ? (
          <div className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
            {error}
            <div className="mt-3">
              <Link
                href="/events"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Etkinlik listesine dön
              </Link>
            </div>
          </div>
        ) : !ev ? (
          <DetailSkeleton />
        ) : (
          <>
            <div className="relative overflow-hidden rounded-2xl border border-outline-variant/35 shadow-xl">
              {ev.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ev.posterUrl}
                  alt=""
                  className="aspect-[21/9] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[21/9] w-full items-center justify-center bg-gradient-to-br from-primary/35 via-surface-container-high to-secondary/25">
                  <IconMusicNote width={72} height={72} className="text-primary/80" />
                </div>
              )}
              <span className="absolute top-4 right-4 rounded bg-primary px-2.5 py-1 font-mono text-xs font-bold text-on-primary">
                CANLI
              </span>
            </div>

            <header className={`${sectionClass} space-y-5`}>
              <div>
                <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
                  Etkinlik
                </p>
                <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
                  {ev.title?.trim() || "Canlı müzik gecesi"}
                </h1>
                {locationLabel ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-on-surface-variant">
                    <IconLocation className="size-4 shrink-0" />
                    {locationLabel}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-outline-variant/30 bg-surface-container/50 px-4 py-3">
                  <p className={sectionTitleClass}>Tarih</p>
                  <p className="mt-2 flex items-start gap-2 text-sm font-medium text-on-surface">
                    <IconCalendar className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{formatWhen(ev.startAt)}</span>
                  </p>
                  {ev.endAt ? (
                    <p className="mt-1 pl-6 text-xs text-on-surface-variant">
                      Bitiş: {formatWhen(ev.endAt)}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-outline-variant/30 bg-surface-container/50 px-4 py-3">
                  <p className={sectionTitleClass}>Liste fiyatı</p>
                  <p className="mt-2 font-display text-2xl font-bold text-on-surface">
                    {ev.price != null
                      ? `${ev.price.toLocaleString("tr-TR")} ₺`
                      : "—"}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    İşletmenin duyurduğu giriş ücreti
                  </p>
                </div>
              </div>
            </header>

            {ev.description ? (
              <section className={sectionClass}>
                <h2 className={sectionTitleClass}>Açıklama</h2>
                <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-on-surface-variant">
                  {ev.description}
                </p>
              </section>
            ) : null}

            <section className={sectionClass}>
              <h2 className={sectionTitleClass}>Mekân</h2>
              <div className="mt-4 flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-secondary/30 bg-secondary/15">
                  <IconStorefront className="size-6 text-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold text-on-surface">
                    {ev.cafe.name}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                    {ev.address}
                  </p>
                  {ev.cafe.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                      {ev.cafe.description}
                    </p>
                  ) : null}
                  {ev.cafe.phone ? (
                    <p className="mt-3 text-sm text-on-surface">
                      <span className="font-medium">Telefon:</span>{" "}
                      {ev.cafe.phone}
                    </p>
                  ) : (
                    <p className="mt-3 text-xs text-on-surface-variant">
                      İşletme telefonu yalnızca yetkili kullanıcılara
                      gösterilir.
                    </p>
                  )}
                </div>
              </div>
              <Link
                href={`/cafes/${ev.cafe.userId}`}
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
              >
                Mekân profili
                <IconChevronRight className="size-4" />
              </Link>
            </section>

            {ev.band ? (
              <section className={sectionClass}>
                <h2 className={sectionTitleClass}>Sahne alan grup</h2>
                <div className="mt-4 flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
                    <IconMusicNote className="size-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-semibold text-on-surface">
                      {ev.band.bandName}
                    </p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {ev.band.memberCount} üye
                    </p>
                    {ev.band.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                        {ev.band.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Link
                  href={`/bands/${ev.band.userId}`}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  Grup profili
                  <IconChevronRight className="size-4" />
                </Link>
              </section>
            ) : null}

          </>
        )}
      </div>
    </div>
  );
}
