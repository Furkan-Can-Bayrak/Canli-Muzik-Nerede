"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getCurrentPosition } from "@/lib/geolocation";
import type { Province, ReverseGeocodeResult } from "@/lib/location-types";

const PROVINCE_KEY = "preferredProvinceId";
const DISTRICT_KEY = "preferredDistrictId";
const GEO_ATTEMPT_KEY = "visitorGeoAttempted";

export type ExploreBandSummary = { id: string; bandName: string };

export type ExploreLocation = {
  id: string;
  name: string;
  plateCode?: string;
};

export type ExploreApiEvent = {
  id: string;
  title: string | null;
  address: string;
  description: string | null;
  startAt: string | null;
  price: number | null;
  posterUrl?: string | null;
  provinceId: string;
  districtId: string | null;
  province: ExploreLocation;
  district: ExploreLocation | null;
  /** @deprecated */
  city?: ExploreLocation;
  /** @deprecated */
  cityId?: string;
  cafe: {
    userId: string;
    name: string;
    address: string;
    description?: string | null;
    phone?: string | null;
    province: ExploreLocation;
    district: ExploreLocation | null;
    city?: ExploreLocation;
  };
  band: { userId: string; bandName: string } | null;
};

export type EventsExploreUrlFilters = {
  q?: string;
  provinceId?: string;
  districtId?: string;
  bandId?: string;
  cafeId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export function eventsExploreUrlFromSearchParams(
  params: URLSearchParams,
): EventsExploreUrlFilters {
  return {
    q: params.get("q") ?? undefined,
    provinceId: params.get("provinceId") ?? undefined,
    districtId: params.get("districtId") ?? undefined,
    bandId: params.get("bandId") ?? undefined,
    cafeId: params.get("cafeId") ?? undefined,
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
  };
}

export function buildEventsPageUrl(filters: {
  q?: string;
  provinceId?: string;
  districtId?: string;
  bandId?: string;
  cafeId?: string;
  dateFrom?: string;
  dateTo?: string;
}): string {
  const qs = new URLSearchParams();
  const q = filters.q?.trim();
  if (q) qs.set("q", q);
  if (filters.provinceId) qs.set("provinceId", filters.provinceId);
  if (filters.districtId) qs.set("districtId", filters.districtId);
  if (filters.bandId) qs.set("bandId", filters.bandId);
  if (filters.cafeId?.trim()) qs.set("cafeId", filters.cafeId.trim());
  if (filters.dateFrom) qs.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) qs.set("dateTo", filters.dateTo);
  const query = qs.toString();
  return query ? `/events?${query}` : "/events";
}

export function useEventsExplore(
  token: string | null,
  ready: boolean,
  initialCafeId = "",
  urlFilters?: EventsExploreUrlFilters | null,
) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [bands, setBands] = useState<ExploreBandSummary[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [bandId, setBandId] = useState("");
  const [q, setQ] = useState("");
  const [cafeId, setCafeId] = useState(initialCafeId);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [events, setEvents] = useState<ExploreApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const urlFiltersApplied = useRef(false);

  useEffect(() => {
    if (!urlFilters || urlFiltersApplied.current || provinces.length === 0) {
      return;
    }
    urlFiltersApplied.current = true;
    if (urlFilters.q) setQ(urlFilters.q);
    if (urlFilters.cafeId) setCafeId(urlFilters.cafeId);
    if (urlFilters.bandId) setBandId(urlFilters.bandId);
    if (urlFilters.dateFrom) setDateFrom(urlFilters.dateFrom);
    if (urlFilters.dateTo) setDateTo(urlFilters.dateTo);
    if (urlFilters.provinceId) {
      setProvinceId(urlFilters.provinceId);
      setDistrictId(urlFilters.districtId ?? "");
    }
  }, [urlFilters, provinces.length]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [provincesRes, bandsRes] = await Promise.all([
          apiFetch("/provinces"),
          apiFetch("/bands"),
        ]);
        if (!provincesRes.ok) throw new Error("İl listesi alınamadı.");
        const provinceData = (await provincesRes.json()) as Province[];
        if (!cancelled) setProvinces(provinceData);
        if (bandsRes.ok && !cancelled) {
          const bandData = (await bandsRes.json()) as ExploreBandSummary[];
          setBands(bandData);
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Ağ hatası.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyLocation = useCallback((data: ReverseGeocodeResult) => {
      if (!data.provinceId) return false;
      setProvinceId(data.provinceId);
      setDistrictId(data.districtId ?? "");
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
    async (coords: { lat: number; lng: number }) => {
      const qs = new URLSearchParams({
        lat: String(coords.lat),
        lng: String(coords.lng),
      });
      const res = await apiFetch(`/geocoding/reverse?${qs.toString()}`);
      if (!res.ok) return false;
      const data = (await res.json()) as ReverseGeocodeResult;
      return applyLocation(data);
    },
    [applyLocation],
  );

  useEffect(() => {
    if (provinces.length === 0 || provinceId) return;
    if (urlFilters?.provinceId) return;

    try {
      const savedProvince = localStorage.getItem(PROVINCE_KEY);
      const savedDistrict = localStorage.getItem(DISTRICT_KEY) ?? "";
      if (savedProvince) {
        setProvinceId(savedProvince);
        setDistrictId(savedDistrict);
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

  const useMyLocation = useCallback(async () => {
    setLocating(true);
    setError(null);
    try {
      const coords = await getCurrentPosition();
      if (!(await resolveLocationFromCoords(coords))) {
        throw new Error("Bulunduğunuz il henüz desteklenmiyor.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Konum alınamadı.");
    } finally {
      setLocating(false);
    }
  }, [resolveLocationFromCoords]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      const query = q.trim();
      if (query) qs.set("q", query);
      const cId = cafeId.trim();
      if (cId) qs.set("cafeId", cId);
      if (provinceId) qs.set("provinceId", provinceId);
      if (districtId) qs.set("districtId", districtId);
      if (bandId) qs.set("bandId", bandId);
      const minP = minPrice.trim();
      const maxP = maxPrice.trim();
      if (minP !== "" && Number.isFinite(Number(minP))) {
        qs.set("minPrice", String(Number(minP)));
      }
      if (maxP !== "" && Number.isFinite(Number(maxP))) {
        qs.set("maxPrice", String(Number(maxP)));
      }
      if (dateFrom) {
        qs.set(
          "startAtFrom",
          new Date(`${dateFrom}T00:00:00`).toISOString(),
        );
      }
      if (dateTo) {
        qs.set(
          "startAtTo",
          new Date(`${dateTo}T23:59:59.999`).toISOString(),
        );
      }
      qs.set("take", "50");
      const res = await apiFetch(`/events?${qs.toString()}`, { token });
      if (!res.ok) throw new Error("Etkinlikler yüklenemedi.");
      const data = (await res.json()) as ExploreApiEvent[];
      setEvents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ağ hatası.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [
    provinceId,
    districtId,
    bandId,
    q,
    cafeId,
    minPrice,
    maxPrice,
    dateFrom,
    dateTo,
    token,
  ]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void loadEvents();
    });
    return () => {
      cancelled = true;
    };
  }, [loadEvents, ready]);

  const setHeroSingleDate = useCallback((isoDay: string) => {
    if (!isoDay) {
      setDateFrom("");
      setDateTo("");
      return;
    }
    setDateFrom(isoDay);
    setDateTo(isoDay);
  }, []);

  const setProvinceIdPersist = useCallback((id: string) => {
    setProvinceId(id);
    setDistrictId("");
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
    try {
        if (id) localStorage.setItem(DISTRICT_KEY, id);
        else localStorage.removeItem(DISTRICT_KEY);
      } catch {
        /* ignore */
      }
  }, []);

  const heroDateValue =
    dateFrom && dateTo && dateFrom === dateTo ? dateFrom : "";

  return {
    provinces,
    /** @deprecated use provinces */
    cities: provinces,
    bands,
    provinceId,
    setProvinceId: setProvinceIdPersist,
    districtId,
    setDistrictId: setDistrictIdPersist,
    /** @deprecated use provinceId */
    cityId: provinceId,
    /** @deprecated use setProvinceId */
    setCityId: setProvinceIdPersist,
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
    heroDateValue,
    setHeroSingleDate,
    events,
    loading,
    error,
    loadEvents,
    locating,
    useMyLocation,
  };
}

export type EventsExploreState = ReturnType<typeof useEventsExplore>;
