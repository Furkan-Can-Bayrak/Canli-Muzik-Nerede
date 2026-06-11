"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatBandPlayAreas } from "@/components/location/BandAreaPicker";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import {
  bandCoverMedia,
  normalizeBandMedia,
} from "@/lib/band-media";

type City = { id: string; name: string };
type BandDistrict = { id: string; name: string; provinceName: string };
type Genre = { id: string; name: string };
type Media = { id: string; type: string; url: string };

type BandDetail = {
  id: string;
  bandName: string;
  memberCount: number;
  description: string | null;
  phone?: string;
  basePrice?: number;
  provinces?: City[];
  districts?: BandDistrict[];
  cities: City[];
  genres: Genre[];
  media?: Media[];
};

function formatPrice(amount: number) {
  return `${amount.toLocaleString("tr-TR")} ₺`;
}

const sectionClass =
  "glass-card rounded-2xl border border-outline-variant/35 p-5 shadow-xl md:p-6";
const sectionTitleClass =
  "text-xs font-semibold uppercase tracking-wider text-primary/90";

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-card animate-pulse rounded-2xl border border-outline-variant/35 p-8">
        <div className="h-8 w-56 rounded-lg bg-surface-container-high" />
        <div className="mt-3 h-4 w-72 rounded-lg bg-surface-container-high" />
        <div className="mt-4 flex gap-2">
          <div className="h-7 w-16 rounded-full bg-surface-container-high" />
          <div className="h-7 w-20 rounded-full bg-surface-container-high" />
        </div>
      </div>
      <div className="glass-card aspect-video animate-pulse rounded-2xl border border-outline-variant/35 bg-surface-container-high" />
    </div>
  );
}

export default function BandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { token, ready, user } = useAuth();
  const [band, setBand] = useState<BandDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messagePending, setMessagePending] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !ready) return;

    let cancelled = false;

    void (async () => {
      try {
        const res = await apiFetch(`/bands/${id}`, { token });
        if (res.status === 404) {
          if (!cancelled) setError("Grup bulunamadı.");
          return;
        }
        if (!res.ok) throw new Error();
        const data = (await res.json()) as BandDetail;
        if (!cancelled) {
          setBand({ ...data, media: normalizeBandMedia(data.media) });
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Yüklenemedi.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, ready, token]);

  const media = band?.media ?? [];
  const videos = media.filter((m) => m.type === "VIDEO");
  const images = media.filter((m) => m.type === "IMAGE");
  const cover = band
    ? bandCoverMedia(media, band.genres, band.id)
    : null;
  const playAreas = band
    ? formatBandPlayAreas(
        band.provinces ?? band.cities ?? [],
        band.districts ?? [],
      )
    : "";
  const showBusinessInfo =
    band != null &&
    (band.phone != null || band.basePrice != null);

  async function startConversation() {
    if (!token || !band) return;
    setMessagePending(true);
    setMessageError(null);
    try {
      const res = await apiFetch("/conversations", {
        method: "POST",
        token,
        body: JSON.stringify({ otherUserId: band.id }),
      });
      if (!res.ok) throw new Error("Sohbet başlatılamadı.");
      const conv = (await res.json()) as { id: string };
      router.push(`/messages/${conv.id}`);
    } catch {
      setMessageError("Mesajlaşma açılamadı. Lütfen tekrar deneyin.");
    } finally {
      setMessagePending(false);
    }
  }

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
          href="/bands"
          className="inline-flex items-center gap-1 rounded-full border border-outline-variant/50 px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
        >
          ← Tüm gruplar
        </Link>

        {error ? (
          <div className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
            {error}
            <div className="mt-3">
              <Link
                href="/bands"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Grup listesine dön
              </Link>
            </div>
          </div>
        ) : !band ? (
          <DetailSkeleton />
        ) : (
          <>
            {cover ? (
              <div className="neon-glow overflow-hidden rounded-3xl border border-outline-variant/35">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cover.url}
                  alt=""
                  className="aspect-[16/9] w-full object-cover md:aspect-[21/9]"
                />
              </div>
            ) : null}

            <header className={`${sectionClass} space-y-4`}>
              <div>
                <p className={sectionTitleClass}>Grup</p>
                <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
                  {band.bandName}
                </h1>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-on-surface-variant">
                <span>{band.memberCount} üye</span>
                {playAreas ? (
                  <>
                    <span className="text-outline-variant">·</span>
                    <span>{playAreas}</span>
                  </>
                ) : null}
              </div>
              {band.genres.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {band.genres.map((g) => (
                    <span
                      key={g.id}
                      className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </header>

            {showBusinessInfo ? (
              <section className={sectionClass}>
                <h2 className={sectionTitleClass}>İşletme için iletişim</h2>
                <dl className="mt-4 space-y-3">
                  {band.basePrice != null ? (
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-outline-variant/20 pb-3">
                      <dt className="text-sm font-medium text-on-surface-variant">
                        Taban fiyat
                      </dt>
                      <dd className="font-display text-xl font-semibold text-on-surface">
                        {formatPrice(band.basePrice)}
                      </dd>
                    </div>
                  ) : null}
                  {band.phone ? (
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <dt className="text-sm font-medium text-on-surface-variant">
                        Telefon
                      </dt>
                      <dd>
                        <a
                          href={`tel:${band.phone.replace(/\s/g, "")}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {band.phone}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>
                {user?.role === "CAFE" ? (
                  <div className="mt-5 space-y-2">
                    <button
                      type="button"
                      onClick={() => void startConversation()}
                      disabled={messagePending}
                      className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-on-primary transition-transform hover:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {messagePending ? "Açılıyor…" : "Grup ile mesajlaş"}
                    </button>
                    {messageError ? (
                      <p className="text-sm text-error">{messageError}</p>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {videos.length > 0 ? (
              <section className="space-y-4">
                <h2 className={sectionTitleClass}>Performans videoları</h2>
                <div className="space-y-4">
                  {videos.map((v) => (
                    <div
                      key={v.id}
                      className="glass-card overflow-hidden rounded-2xl border border-outline-variant/35 shadow-xl"
                    >
                      <video
                        className="aspect-video w-full bg-black"
                        src={v.url}
                        controls
                        playsInline
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {images.length > 0 ? (
              <section className="space-y-4">
                <h2 className={sectionTitleClass}>Görseller</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((im) => (
                    <div
                      key={im.id}
                      className="glass-card overflow-hidden rounded-xl border border-outline-variant/35"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={im.url}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {band.description ? (
              <section className={sectionClass}>
                <h2 className={sectionTitleClass}>Hakkında</h2>
                <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-on-surface-variant">
                  {band.description}
                </p>
              </section>
            ) : null}

            <ReviewsSection
              targetType="BAND"
              targetId={band.id}
              token={token}
              userId={user?.id ?? null}
              isOwnProfile={user?.id === band.id}
            />
          </>
        )}
      </div>
    </div>
  );
}
