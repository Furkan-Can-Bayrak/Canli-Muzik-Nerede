"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatFetchError } from "@/lib/errors";
import { getCurrentPosition } from "@/lib/geolocation";
import type { Province, ReverseGeocodeResult } from "@/lib/location-types";

const PROVINCE_KEY = "preferredProvinceId";
const DISTRICT_KEY = "preferredDistrictId";
const GEO_ATTEMPT_KEY = "visitorGeoAttempted";
export const BANDS_PAGE_SIZE = 12;

export type BandDirectoryItem = {
  id: string;
  bandName: string;
  memberCount: number;
  description: string | null;
  provinces?: { id: string; name: string }[];
  districts?: {
    id: string;
    name: string;
    provinceId?: string;
    provinceName: string;
  }[];
  cities: { id: string; name: string }[];
  genres: { id: string; name: string }[];
  media?: { id: string; type: string; url: string }[];
};

export type GenreOption = { id: string; name: string };

type BandsPageResponse = {
  items: BandDirectoryItem[];
  total: number;
  skip: number;
  take: number;
};

export function useBandsDirectory(token: string | null, ready: boolean) {
  const [bands, setBands] = useState<BandDirectoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [genreId, setGenreId] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [metaReady, setMetaReady] = useState(false);

  const reload = useCallback(() => {
    setMetaError(null);
    setListError(null);
    setMetaReady(false);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        setMetaError(null);
        try {
          const [provincesResult, genresResult] = await Promise.allSettled([
            apiFetch("/provinces"),
            apiFetch("/genres/catalog"),
          ]);
          if (cancelled) return;

          const errors: string[] = [];

          if (provincesResult.status === "fulfilled") {
            if (!provincesResult.value.ok) {
              errors.push("İl listesi alınamadı.");
            } else {
              setProvinces(
                (await provincesResult.value.json()) as Province[],
              );
            }
          } else {
            errors.push(formatFetchError(provincesResult.reason));
          }

          if (genresResult.status === "fulfilled") {
            if (!genresResult.value.ok) {
              errors.push("Müzik türleri yüklenemedi.");
            } else {
              const genreData =
                (await genresResult.value.json()) as GenreOption[];
              setGenres(genreData);
              if (genreData.length === 0) {
                errors.push(
                  "Müzik türleri veritabanında yok. Backend klasöründe npx prisma db seed çalıştırın.",
                );
              }
            }
          } else {
            errors.push(formatFetchError(genresResult.reason));
          }

          if (errors.length > 0) setMetaError(errors.join(" "));
        } catch (e) {
          if (!cancelled) setMetaError(formatFetchError(e));
        } finally {
          if (!cancelled) setMetaReady(true);
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [ready, reloadKey]);

  useEffect(() => {
    if (!ready || !metaReady) return;
    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        setPageLoading(true);
        if (page === 0) setLoading(true);
        setListError(null);
        try {
          const qs = new URLSearchParams({
            take: String(BANDS_PAGE_SIZE),
            skip: String(page * BANDS_PAGE_SIZE),
          });
          if (provinceId) qs.set("provinceId", provinceId);
          if (districtId) qs.set("districtId", districtId);
          if (genreId) qs.set("genreId", genreId);

          const res = await apiFetch(`/bands?${qs.toString()}`, { token });
          if (!res.ok) throw new Error("Gruplar yüklenemedi.");
          const data = (await res.json()) as BandsPageResponse;
          if (!cancelled) {
            setBands(data.items);
            setTotal(data.total);
          }
        } catch (e) {
          if (!cancelled) {
            setListError(formatFetchError(e));
            setBands([]);
            setTotal(0);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
            setPageLoading(false);
          }
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [
    ready,
    metaReady,
    token,
    page,
    provinceId,
    districtId,
    genreId,
    reloadKey,
  ]);

  const applyLocation = useCallback((data: ReverseGeocodeResult) => {
    if (!data.provinceId) return false;
    setProvinceId(data.provinceId);
    setDistrictId(data.districtId ?? "");
    setPage(0);
    setLocationError(null);
    try {
      localStorage.setItem(PROVINCE_KEY, data.provinceId);
      if (data.districtId) {
        localStorage.setItem(DISTRICT_KEY, data.districtId);
      } else {
        localStorage.removeItem(DISTRICT_KEY);
      }
    } catch {
      /* ignore */
    }
    return true;
  }, []);

  const resolveLocationFromCoords = useCallback(
    async (
      coords: { lat: number; lng: number },
    ): Promise<"ok" | "unsupported" | "failed"> => {
      try {
        const qs = new URLSearchParams({
          lat: String(coords.lat),
          lng: String(coords.lng),
        });
        const res = await apiFetch(`/geocoding/reverse?${qs.toString()}`);
        if (!res.ok) return "unsupported";
        const data = (await res.json()) as ReverseGeocodeResult;
        return applyLocation(data) ? "ok" : "unsupported";
      } catch {
        return "failed";
      }
    },
    [applyLocation],
  );

  useEffect(() => {
    if (provinces.length === 0 || provinceId) return;

    try {
      const savedProvince = localStorage.getItem(PROVINCE_KEY);
      const savedDistrict = localStorage.getItem(DISTRICT_KEY) ?? "";
      if (savedProvince) {
        setProvinceId(savedProvince);
        setDistrictId(savedDistrict);
        setPage(0);
        return;
      }
    } catch {
      /* ignore */
    }

    if (sessionStorage.getItem(GEO_ATTEMPT_KEY)) return;

    let cancelled = false;

    (async () => {
      try {
        const coords = await getCurrentPosition();
        if (cancelled) return;
        await resolveLocationFromCoords(coords);
      } catch {
        /* silent fallback */
      } finally {
        if (!cancelled) {
          sessionStorage.setItem(GEO_ATTEMPT_KEY, "1");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [provinces, provinceId, resolveLocationFromCoords]);

  const setProvinceIdPersist = useCallback((id: string) => {
    setProvinceId(id);
    setDistrictId("");
    setPage(0);
    setLocationError(null);
    try {
      if (id) localStorage.setItem(PROVINCE_KEY, id);
      else localStorage.removeItem(PROVINCE_KEY);
      localStorage.removeItem(DISTRICT_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const setDistrictIdPersist = useCallback((id: string) => {
    setDistrictId(id);
    setPage(0);
    setLocationError(null);
    try {
      if (id) localStorage.setItem(DISTRICT_KEY, id);
      else localStorage.removeItem(DISTRICT_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const setGenreIdPersist = useCallback((id: string) => {
    setGenreId(id);
    setPage(0);
  }, []);

  const useMyLocation = useCallback(async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const coords = await getCurrentPosition();
      const result = await resolveLocationFromCoords(coords);
      if (result === "unsupported") {
        setLocationError("Bulunduğunuz il henüz desteklenmiyor.");
      } else if (result === "failed") {
        setLocationError(
          "Konum bilgisi alınamadı. Sunucunun çalıştığından emin olun.",
        );
      }
    } catch (e) {
      setLocationError(formatFetchError(e));
    } finally {
      setLocating(false);
    }
  }, [resolveLocationFromCoords]);

  const totalPages = Math.max(1, Math.ceil(total / BANDS_PAGE_SIZE));
  const currentPage = Math.min(page + 1, totalPages);
  const rangeStart = total === 0 ? 0 : page * BANDS_PAGE_SIZE + 1;
  const rangeEnd = Math.min((page + 1) * BANDS_PAGE_SIZE, total);
  const canGoPrev = page > 0;
  const canGoNext = (page + 1) * BANDS_PAGE_SIZE < total;

  const goPrev = useCallback(() => {
    setPage((p) => Math.max(0, p - 1));
  }, []);

  const goNext = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const selectedProvinceName = provinces.find((p) => p.id === provinceId)?.name;

  return {
    bands,
    total,
    page,
    currentPage,
    totalPages,
    rangeStart,
    rangeEnd,
    canGoPrev,
    canGoNext,
    goPrev,
    goNext,
    provinces,
    genres,
    provinceId,
    setProvinceId: setProvinceIdPersist,
    districtId,
    setDistrictId: setDistrictIdPersist,
    genreId,
    setGenreId: setGenreIdPersist,
    loading,
    pageLoading,
    metaError,
    listError,
    locationError,
    locating,
    useMyLocation,
    reload,
    selectedProvinceName,
    hasActiveFilters: Boolean(provinceId || districtId || genreId),
    metaReady,
  };
}
