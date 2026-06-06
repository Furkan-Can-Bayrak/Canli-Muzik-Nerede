"use client";

import Link from "next/link";
import {
  IconCalendar,
  IconChevronRight,
  IconLocation,
  IconMusicNote,
} from "@/components/icons/outline";
import { ProvinceDistrictSelect } from "@/components/location/ProvinceDistrictSelect";
import type {
  ExploreApiEvent,
  EventsExploreState,
} from "@/hooks/use-events-explore";

function formatWhenShort(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function ExploreNightCard({ ev }: { ev: ExploreApiEvent }) {
  return (
    <li>
      <Link
        href={`/events/${ev.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container transition-all hover:border-primary/45"
      >
        <div className="relative h-48 overflow-hidden bg-surface-container-high">
          {ev.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ev.posterUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/35 via-surface-container-high to-secondary/25">
              <IconMusicNote width={52} height={52} />
            </div>
          )}
          <div className="absolute top-4 right-4 rounded bg-primary px-2 py-1 font-mono text-xs font-medium text-on-primary">
            CANLI
          </div>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs text-primary">
            <IconCalendar width={16} height={16} />
            {formatWhenShort(ev.startAt)}
          </div>
          <h4 className="mb-1 font-display text-xl font-semibold text-on-surface transition-colors group-hover:text-primary">
            {ev.title?.trim() || "Canlı müzik gecesi"}
          </h4>
          <p className="mb-6 flex flex-1 items-start gap-2 text-base text-on-surface-variant">
            <IconLocation width={18} height={18} className="mt-0.5" />
            <span>
              {ev.cafe.name}
              {ev.band ? ` · ${ev.band.bandName}` : ""}
            </span>
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-outline-variant/15 pt-4">
            <span className="font-semibold text-on-surface">
              {ev.price != null
                ? `${ev.price.toLocaleString("tr-TR")} ₺`
                : "Ücret —"}
            </span>
            <span className="flex items-center gap-1 font-mono text-sm font-bold text-secondary transition-all group-hover:gap-2">
              Detay <IconChevronRight className="text-secondary" />
            </span>
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-on-surface-variant">
            Liste fiyatı (işletme duyurusu)
          </p>
        </div>
      </Link>
    </li>
  );
}

export function EventsExplorer({ explore }: { explore: EventsExploreState }) {
  const {
    provinces,
    bands,
    provinceId,
    setProvinceId,
    districtId,
    setDistrictId,
    bandId,
    setBandId,
    q,
    setQ,
    cafeId,
    setCafeId,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    events,
    loading,
    error,
    loadEvents,
  } = explore;

  return (
    <section id="explore" className="scroll-mt-24 bg-surface-container-low">
      <div className="mx-auto max-w-container-max space-y-10 px-margin-mobile py-24 md:px-margin-desktop">
        <div className="space-y-4">
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-secondary">
            Takvim
          </span>
          <h2 className="font-display text-3xl font-bold text-on-surface md:text-4xl">
            Yaklaşan etkinlikler
          </h2>
          <p className="max-w-3xl text-base leading-relaxed text-on-surface-variant">
            Şehir, tarih, grup ve anahtar kelime ile süzün.{" "}
            <strong className="font-semibold text-on-surface">
              Liste fiyatı
            </strong>{" "}
            işletmenin duyurduğu giriş bilgisidir; grup ile görüşülen ücretler
            burada görünmez.
          </p>
        </div>

        <div className="sticky top-16 z-10 space-y-4 rounded-2xl border border-outline-variant/25 bg-surface/90 p-5 backdrop-blur-xl">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="sm:col-span-2">
              <ProvinceDistrictSelect
                provinces={provinces}
                provinceId={provinceId}
                districtId={districtId}
                onProvinceChange={setProvinceId}
                onDistrictChange={setDistrictId}
                provinceLabel="İl"
                districtLabel="İlçe"
                compact
              />
            </div>
            <div>
              <label
                className="mb-1 block font-mono text-xs font-medium text-on-surface-variant"
                htmlFor="band-filter"
              >
                Grup
              </label>
              <select
                id="band-filter"
                value={bandId}
                onChange={(e) => setBandId(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-base text-on-surface outline-none focus:border-primary/50"
              >
                <option value="">Tüm gruplar</option>
                {bands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bandName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="mb-1 block font-mono text-xs font-medium text-on-surface-variant"
                htmlFor="date-from"
              >
                Başlangıç
              </label>
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-base text-on-surface [color-scheme:dark] outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label
                className="mb-1 block font-mono text-xs font-medium text-on-surface-variant"
                htmlFor="date-to"
              >
                Bitiş
              </label>
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-base text-on-surface [color-scheme:dark] outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_minmax(0,11rem)_minmax(0,11rem)_auto] lg:items-end">
            <div>
              <label
                className="mb-1 block font-mono text-xs font-medium text-on-surface-variant"
                htmlFor="venue-q"
              >
                Mekân / kafe adı
              </label>
              <input
                id="venue-q"
                type="search"
                placeholder="Örn. Kadıköy…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-base text-on-surface outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label
                className="mb-1 block font-mono text-xs font-medium text-on-surface-variant"
                htmlFor="min-price"
              >
                Min. ₺
              </label>
              <input
                id="min-price"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="—"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-base text-on-surface outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label
                className="mb-1 block font-mono text-xs font-medium text-on-surface-variant"
                htmlFor="max-price"
              >
                Max. ₺
              </label>
              <input
                id="max-price"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="—"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-base text-on-surface outline-none focus:border-primary/50"
              />
            </div>
            <button
              type="button"
              onClick={() => void loadEvents()}
              className="min-h-11 rounded-full bg-primary-container px-6 text-base font-bold text-on-primary-container transition-opacity hover:opacity-90 lg:self-end"
            >
              Listeyi yenile
            </button>
          </div>

          <details className="rounded-xl border border-outline-variant/30 bg-surface-container/80 px-4 py-3 text-base">
            <summary className="cursor-pointer font-medium text-on-surface">
              Gelişmiş filtre
            </summary>
            <div className="mt-3">
              <label
                className="mb-1 block font-mono text-xs text-on-surface-variant"
                htmlFor="cafe-id"
              >
                Kafe kullanıcı UUID
              </label>
              <input
                id="cafe-id"
                placeholder="İşletme panelinden"
                value={cafeId}
                onChange={(e) => setCafeId(e.target.value)}
                className="w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 font-mono text-xs text-on-surface outline-none focus:border-primary/50"
              />
            </div>
          </details>
        </div>

        {error ? (
          <div className="rounded-xl border border-error/40 bg-error-container/15 px-4 py-3 text-sm text-error">
            {error}{" "}
            <span className="mt-1 block text-xs opacity-90">
              Backend ve{" "}
              <code className="rounded bg-surface-container-high px-1">
                NEXT_PUBLIC_API_URL
              </code>{" "}
              ayarını kontrol edin.
            </span>
          </div>
        ) : null}

        {loading ? (
          <p className="text-base text-on-surface-variant">Yükleniyor…</p>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container/60 px-6 py-14 text-center">
            <p className="font-display text-lg font-semibold text-on-surface">
              Bu filtreye uygun yayında etkinlik yok.
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-on-surface-variant">
              Filtreleri gevşetin veya tarih aralığını genişletin. Gruplu
              etkinlikler önce taslakta olabilir; grup onayından sonra keşifte
              görünür.
            </p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {events.map((ev) => (
              <ExploreNightCard key={ev.id} ev={ev} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
