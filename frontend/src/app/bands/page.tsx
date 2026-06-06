"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBandPlayAreas } from "@/components/location/BandAreaPicker";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

type City = { id: string; name: string };
type BandDistrict = { id: string; name: string; provinceName: string };
type Genre = { id: string; name: string };

type BandPublic = {
  id: string;
  bandName: string;
  memberCount: number;
  description: string | null;
  provinces?: City[];
  districts?: BandDistrict[];
  cities: City[];
  genres: Genre[];
  media?: { id: string; type: string; url: string }[];
};

export default function BandsDirectoryPage() {
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
          if (!res.ok) throw new Error("Gruplar yüklenemedi.");
          const data = (await res.json()) as BandPublic[];
          if (!cancelled) setBands(data);
        } catch {
          if (!cancelled) setError("Liste alınamadı.");
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [ready, token]);

  function poster(b: BandPublic) {
    const vid = b.media?.find((m) => m.type === "VIDEO");
    if (vid) return { kind: "video" as const, url: vid.url };
    const img = b.media?.find((m) => m.type === "IMAGE");
    if (img) return { kind: "image" as const, url: img.url };
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Gruplar
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Tanıtım içerikleri ve sahne aldığı şehirler. Telefon ve taban fiyat
          bilgileri yalnızca işletme hesaplarıyla görüşme bağlamında
          görüntülenebilir.
        </p>
      </header>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <ul className="grid gap-6 sm:grid-cols-2">
        {bands.map((b) => {
          const thumb = poster(b);
          return (
            <li key={b.id}>
              <Link href={`/bands/${b.id}`} className="block h-full">
                <Card className="h-full overflow-hidden transition hover:ring-2 hover:ring-[var(--accent)]">
                  <div className="aspect-video bg-zinc-100 dark:bg-zinc-800">
                    {thumb?.kind === "video" ? (
                      <video
                        className="h-full w-full object-cover"
                        src={thumb.url}
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : thumb?.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                        Önizleme yok
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {b.bandName}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {b.memberCount} üye ·{" "}
                      {formatBandPlayAreas(
                        b.provinces ?? b.cities ?? [],
                        b.districts ?? [],
                      )}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {b.genres.slice(0, 5).map((g) => (
                        <span
                          key={g.id}
                          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>

      {bands.length === 0 && !error ? (
        <p className="text-sm text-zinc-500">
          Kayıtlı grup bulunamadı (veya yükleniyor…).
        </p>
      ) : null}
    </div>
  );
}
