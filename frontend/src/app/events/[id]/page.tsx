"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

function formatWhen(iso: string | null) {
  if (!iso) return "—";
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

export default function EventDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { token, ready } = useAuth();
  const [ev, setEv] = useState<ApiEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !ready) return;
    let cancelled = false;
    (async () => {
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← Geri
      </button>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
          <div className="mt-3">
            <Link href="/" className="font-medium underline">
              Ana sayfaya dön
            </Link>
          </div>
        </div>
      ) : !ev ? (
        <p className="text-sm text-zinc-500">Yükleniyor…</p>
      ) : (
        <article className="space-y-6">
          <header>
            <p className="text-sm text-zinc-500">
              {ev.province.name}
              {ev.district ? ` · ${ev.district.name}` : ""}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {ev.title?.trim() || "Canlı müzik gecesi"}
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              {formatWhen(ev.startAt)}
              {ev.endAt ? ` — ${formatWhen(ev.endAt)}` : null}
            </p>
          </header>

          {ev.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ev.posterUrl}
              alt=""
              className="max-h-80 w-full rounded-xl object-cover"
            />
          ) : null}

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-medium text-zinc-500">Mekân</h2>
            <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
              {ev.cafe.name}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {ev.address}
            </p>
            {ev.cafe.description ? (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {ev.cafe.description}
              </p>
            ) : null}
            {ev.cafe.phone ? (
              <p className="mt-3 text-sm text-zinc-800 dark:text-zinc-200">
                İletişim: {ev.cafe.phone}
              </p>
            ) : (
              <p className="mt-3 text-xs text-zinc-500">
                İşletme telefonu yalnızca yetkili kullanıcılara gösterilir.
              </p>
            )}
          </section>

          {ev.band ? (
            <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-sm font-medium text-zinc-500">Grup</h2>
              <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
                {ev.band.bandName}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {ev.band.memberCount} üye
              </p>
              {ev.band.description ? (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {ev.band.description}
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-medium text-zinc-500">
              Etkinlik ücreti
            </h2>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {ev.price != null
                ? `${ev.price.toLocaleString("tr-TR")} ₺`
                : "Ücret bilgisi yok"}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Bu, işletmenin duyurduğu etkinlik / liste ücretidir. Grup ile
              görüşülen ticari koşullar kamuya açık değildir.
            </p>
          </section>

          {ev.description ? (
            <section>
              <h2 className="text-sm font-medium text-zinc-500">Açıklama</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {ev.description}
              </p>
            </section>
          ) : null}
        </article>
      )}
    </div>
  );
}