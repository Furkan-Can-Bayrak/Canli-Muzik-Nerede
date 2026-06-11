"use client";

import Image from "next/image";
import {
  IconCalendar,
  IconLocation,
  IconSearch,
  IconStorefront,
} from "@/components/icons/outline";
import { HOME_HERO_IMAGE } from "@/components/home/constants";
import { ProvinceDistrictSelect } from "@/components/location/ProvinceDistrictSelect";
import type { EventsExploreState } from "@/hooks/use-events-explore";

export function HomeHero({
  explore,
  onSearch,
}: {
  explore: EventsExploreState;
  onSearch: () => void;
}) {
  const {
    provinces,
    provinceId,
    setProvinceId,
    districtId,
    setDistrictId,
    heroDateValue,
    setHeroSingleDate,
    q,
    setQ,
    locating,
    useMyLocation,
  } = explore;

  return (
    <section className="relative flex min-h-[min(870px,100svh)] items-center justify-center overflow-hidden py-16">
      <div className="absolute inset-0 z-0">
        <Image
          src={HOME_HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover brightness-[0.45]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface/25 via-surface/45 to-surface" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-container-max px-margin-mobile text-center md:px-margin-desktop">
        <h1 className="mx-auto mb-6 max-w-4xl font-display text-5xl font-extrabold leading-tight tracking-tight text-on-surface md:text-7xl md:leading-[1.1]">
          Müziğin Kalbinin Attığı{" "}
          <span className="text-primary">Yeri Keşfet.</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-on-surface-variant md:text-xl md:leading-relaxed">
          Şehrindeki canlı müzik etkinliklerini, grupları ve mekânları tek
          yerden bul.
        </p>
        <div className="glass-card mx-auto w-full max-w-6xl rounded-2xl border border-outline-variant/35 p-3 shadow-2xl md:rounded-3xl md:p-4">
          <div className="grid w-full grid-cols-1 gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <ProvinceDistrictSelect
                provinces={provinces}
                provinceId={provinceId}
                districtId={districtId}
                onProvinceChange={setProvinceId}
                onDistrictChange={setDistrictId}
                compact
                className="min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={() => void useMyLocation()}
                disabled={locating}
                className="cursor-pointer rounded-full border border-outline-variant/50 px-4 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
              >
                {locating ? "Konum alınıyor…" : "Konumumu kullan"}
              </button>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] md:gap-3">
              <div className="flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface/20 px-4 py-3">
                <IconCalendar />
                <input
                  type="date"
                  value={heroDateValue}
                  onChange={(e) => setHeroSingleDate(e.target.value)}
                  className="min-w-0 flex-1 border-none bg-transparent py-1 font-sans text-base text-on-surface outline-none [color-scheme:dark] focus:ring-0"
                />
              </div>
              <div className="flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface/20 px-4 py-3">
                <IconStorefront />
                <input
                  type="search"
                  placeholder="Mekân veya grup ara…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSearch();
                  }}
                  className="min-w-0 flex-1 border-none bg-transparent py-1 font-sans text-base text-on-surface placeholder:text-on-surface-variant focus:ring-0"
                />
              </div>
              <button
                type="button"
                onClick={onSearch}
                className="flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-container px-6 py-3.5 text-base font-bold text-on-primary-container transition-all hover:opacity-90 sm:px-8"
              >
                <IconSearch />
                <span className="whitespace-nowrap">Ara</span>
              </button>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-4 flex max-w-2xl items-center justify-center gap-2 text-xs text-on-surface-variant">
          <IconLocation />
          İl ve ilçe seçerek veya konumunuzla yakın etkinlikleri filtreleyin.
        </p>
      </div>
    </section>
  );
}
