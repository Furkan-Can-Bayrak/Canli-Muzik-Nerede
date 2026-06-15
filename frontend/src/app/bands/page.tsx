"use client";

import Link from "next/link";
import { formatBandPlayAreas } from "@/components/location/BandAreaPicker";
import { ProvinceDistrictSelect } from "@/components/location/ProvinceDistrictSelect";
import { useAuth } from "@/contexts/auth-context";
import { useBandsDirectory } from "@/hooks/use-bands-directory";
import { bandCoverMedia } from "@/lib/band-media";

const GENRE_BADGE = ["primary", "secondary", "tertiary"] as const;

function badgeClass(badge: (typeof GENRE_BADGE)[number]) {
  return badge === "primary"
    ? "bg-primary/20 text-primary"
    : badge === "secondary"
      ? "bg-secondary/20 text-secondary"
      : "bg-tertiary/20 text-tertiary";
}

function BandsSkeleton() {
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

export default function BandsDirectoryPage() {
  const { token, ready } = useAuth();
  const {
    bands,
    provinces,
    genres,
    provinceId,
    setProvinceId,
    districtId,
    setDistrictId,
    genreId,
    setGenreId,
    loading,
    pageLoading,
    metaError,
    listError,
    locationError,
    locating,
    useMyLocation,
    reload,
    selectedProvinceName,
    hasActiveFilters,
    total,
    currentPage,
    totalPages,
    rangeStart,
    rangeEnd,
    canGoPrev,
    canGoNext,
    goPrev,
    goNext,
    metaReady,
  } = useBandsDirectory(token, ready);

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
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
            Sahne senin
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-on-surface md:text-5xl">
            Gruplar
          </h1>
          <p className="mt-4 text-base leading-relaxed text-on-surface-variant">
            Tanıtım içerikleri ve sahne aldığı bölgeler. Telefon ve taban fiyat
            bilgileri yalnızca işletme hesaplarıyla görüşme bağlamında
            görüntülenebilir.
          </p>
        </header>

        <div className="sticky top-16 z-10 space-y-4 rounded-2xl border border-outline-variant/25 bg-surface/90 p-5 backdrop-blur-xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="text-sm text-on-surface-variant">
              {selectedProvinceName
                ? `${selectedProvinceName} bölgesinde sahne alan gruplar gösteriliyor.`
                : "Konumunuza göre otomatik filtre uygulanır; isterseniz aşağıdan değiştirin."}
            </p>
            <button
              type="button"
              onClick={() => void useMyLocation()}
              disabled={locating}
              className="cursor-pointer rounded-full border border-outline-variant/50 px-4 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
            >
              {locating ? "Konum alınıyor…" : "Konumumu kullan"}
            </button>
          </div>
          {locationError ? (
            <p className="rounded-lg border border-error/25 bg-error-container/15 px-3 py-2 text-sm text-error">
              {locationError}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_minmax(0,14rem)]">
            <ProvinceDistrictSelect
              provinces={provinces}
              provinceId={provinceId}
              districtId={districtId}
              onProvinceChange={(id) => {
                setProvinceId(id);
                setDistrictId("");
              }}
              onDistrictChange={setDistrictId}
              provinceLabel="Şehir (il)"
              districtLabel="İlçe"
              compact
            />
            <div>
              <label
                className="block text-sm font-medium text-on-surface-variant"
                htmlFor="genre-filter"
              >
                Grup türü
              </label>
              <select
                id="genre-filter"
                value={genreId}
                onChange={(e) => setGenreId(e.target.value)}
                disabled={!metaReady && genres.length === 0}
                className="mt-1.5 min-h-11 w-full cursor-pointer rounded-xl border border-outline-variant/40 bg-surface-container/60 px-4 py-2.5 font-sans text-base text-on-surface outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:cursor-wait disabled:opacity-60 [color-scheme:dark]"
              >
                <option value="">
                  {!metaReady && genres.length === 0
                    ? "Türler yükleniyor…"
                    : "Tüm türler"}
                </option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {metaError ? (
                <p className="mt-2 text-xs text-error">{metaError}</p>
              ) : null}
            </div>
          </div>
        </div>

        {listError ? (
          <div className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
            <p>{listError}</p>
            <button
              type="button"
              onClick={reload}
              className="mt-2 font-medium underline underline-offset-2 hover:opacity-80"
            >
              Tekrar dene
            </button>
          </div>
        ) : null}

        {loading ? (
          <BandsSkeleton />
        ) : bands.length === 0 ? (
          listError ? null : (
          <div className="glass-card rounded-2xl border border-dashed border-outline-variant/40 px-6 py-16 text-center">
            <p className="font-display text-lg font-semibold text-on-surface">
              {hasActiveFilters
                ? "Bu filtreye uygun grup bulunamadı"
                : "Henüz kayıtlı grup yok"}
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              {hasActiveFilters
                ? "Farklı bir şehir, ilçe veya grup türü deneyin."
                : "Yeni gruplar eklendiğinde burada listelenecek."}
            </p>
          </div>
          )
        ) : (
          <div className="space-y-8">
            <ul
              className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${pageLoading ? "opacity-50" : ""}`}
            >
            {bands.map((b, i) => {
              const thumb = bandCoverMedia(b.media, b.genres, b.id);
              const genre = b.genres[0]?.name ?? "Canlı müzik";
              const badge = GENRE_BADGE[i % GENRE_BADGE.length];
              const playAreas = formatBandPlayAreas(
                b.provinces ?? b.cities ?? [],
                b.districts ?? [],
              );
              const subtitle =
                b.description?.slice(0, 100) ||
                `${b.memberCount} üye${playAreas ? ` · ${playAreas}` : ""}`;

              return (
                <li key={b.id}>
                  <Link
                    href={`/bands/${b.id}`}
                    className="neon-glow group relative block aspect-[4/5] overflow-hidden rounded-3xl"
                  >
                    <div className="absolute inset-0 bg-surface-container-high">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb.url}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/40 via-surface-container-high to-secondary/30" />
                      )}
                    </div>
                    <div className="gradient-overlay absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                      <span
                        className={`mb-3 w-fit rounded-full px-3 py-1 font-mono text-xs font-medium backdrop-blur-md ${badgeClass(badge)}`}
                      >
                        {genre}
                      </span>
                      <h2 className="font-display text-2xl font-semibold text-on-surface">
                        {b.bandName}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant opacity-90 transition-opacity duration-300 group-hover:opacity-100">
                        {subtitle}
                      </p>
                      {b.genres.length > 1 ? (
                        <div className="mt-3 flex flex-wrap gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          {b.genres.slice(1, 4).map((g) => (
                            <span
                              key={g.id}
                              className="rounded-full border border-on-surface/20 bg-surface/20 px-2 py-0.5 text-[10px] font-medium text-on-surface backdrop-blur-sm"
                            >
                              {g.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
            </ul>

            {totalPages > 1 ? (
              <nav
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant/25 bg-surface-container/60 px-5 py-4"
                aria-label="Sayfalama"
              >
                <p className="text-sm text-on-surface-variant">
                  {total > 0
                    ? `${rangeStart}–${rangeEnd} / ${total} grup`
                    : "0 grup"}
                  {pageLoading ? " · Yükleniyor…" : null}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={!canGoPrev || pageLoading}
                    className="min-h-10 rounded-full border border-outline-variant/50 px-4 text-sm font-medium text-on-surface transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Önceki
                  </button>
                  <span className="min-w-[6rem] text-center font-mono text-sm text-on-surface-variant">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canGoNext || pageLoading}
                    className="min-h-10 rounded-full border border-outline-variant/50 px-4 text-sm font-medium text-on-surface transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sonraki
                  </button>
                </div>
              </nav>
            ) : total > 0 ? (
              <p className="text-center text-sm text-on-surface-variant">
                Toplam {total} grup
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
