"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatBandPlayAreas } from "@/components/location/BandAreaPicker";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

type City = { id: string; name: string };
type BandDistrict = { id: string; name: string; provinceName: string };
type Genre = { id: string; name: string };
type Media = { id: string; type: string; url: string };

type BandDetail = {
  id: string;
  bandName: string;
  memberCount: number;
  description: string | null;
  provinces?: City[];
  districts?: BandDistrict[];
  cities: City[];
  genres: Genre[];
  media?: Media[];
  phone?: string;
  basePrice?: number;
};

export default function BandDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { token, ready } = useAuth();
  const [band, setBand] = useState<BandDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !ready) return;
    let cancelled = false;
    queueMicrotask(() => {
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
            setBand(data);
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

  const videos = band?.media?.filter((m) => m.type === "VIDEO") ?? [];
  const images = band?.media?.filter((m) => m.type === "IMAGE") ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <Link
        href="/bands"
        className="text-sm text-zinc-600 underline dark:text-zinc-400"
      >
        ← Tüm gruplar
      </Link>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : !band ? (
        <p className="text-sm text-zinc-500">Yükleniyor…</p>
      ) : (
        <>
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {band.bandName}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {band.memberCount} üye ·{" "}
              {formatBandPlayAreas(
                band.provinces ?? band.cities ?? [],
                band.districts ?? [],
              )}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {band.genres.map((g) => (
                <span
                  key={g.id}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {g.name}
                </span>
              ))}
            </div>
          </header>

          {videos.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                Tanıtım videoları
              </h2>
              <div className="space-y-4">
                {videos.map((v) => (
                  <Card key={v.id} className="overflow-hidden">
                    <video
                      className="aspect-video w-full bg-black"
                      src={v.url}
                      controls
                      playsInline
                    />
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {images.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                Görseller
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {images.map((im) => (
                  <Card key={im.id} className="overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={im.url}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {band.description ? (
            <section>
              <h2 className="text-sm font-medium text-zinc-500">Hakkında</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {band.description}
              </p>
            </section>
          ) : null}

          <Card className="p-4">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {band.phone != null || band.basePrice != null ? (
                <>
                  İletişim ve ücret bilgileri bu oturum için görünür (işletme —
                  grup görüşmesi kapsamında).
                  {band.basePrice != null ? (
                    <> Taban fiyat: {band.basePrice.toLocaleString("tr-TR")} ₺</>
                  ) : null}
                </>
              ) : (
                <>
                  Telefon ve grup taban fiyatı müşteri profillerinde
                  gösterilmez. Bir işletme hesabıyla anlaşma sürecinde
                  kullanılır.
                </>
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/register"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90"
              >
                İşletme olarak kayıt
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Giriş yap
              </Link>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
