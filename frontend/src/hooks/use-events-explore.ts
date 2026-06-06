"use client";

import { useCallback, useEffect, useState } from "react";
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

export function useEventsExplore(token: string | null, ready: boolean) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [bands, setBands] = useState<ExploreBandSummary[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [bandId, setBandId] = useState("");
  const [q, setQ] = useState("");
  const [cafeId, setCafeId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [events, setEvents] = useState<ExploreApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

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

  const applyLocation = useCallback(
    (data: ReverseGeocodeResult, provincesList: Province[]) => {
      if (!data.provinceId) return false;
      setProvinceId(data.provinceId);
      setDistrictId(data.districtId ?? "");
      const province = provincesList.find((p) => p.id === data.provinceId);
      const districtName = data.district?.name;
      if (province && districtName) {
        setLocationLabel(`${province.name} · ${districtName}`);
      } else if (province) {
        setLocationLabel(province.name);
      }
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
    },
    [],
  );

  useEffect(() => {
    if (provinces.length === 0 || provinceId) return;

    try {
      const savedProvince = localStorage.getItem(PROVINCE_KEY);
      const savedDistrict = localStorage.getItem(DISTRICT_KEY) ?? "";
      if (savedProvince) {
        setProvinceId(savedProvince);
        setDistrictId(savedDistrict);
        const p = provinces.find((x) => x.id === savedProvince);
        if (p) setLocationLabel(p.name);
        return;
      }
    } catch {
      /* ignore */
    }

    if (sessionStorage.getItem(GEO_ATTEMPT_KEY)) return;

    let cancelled = false;
    sessionStorage.setItem(GEO_ATTEMPT_KEY, "1");

    (async () => {
      try {
        const coords = await getCurrentPosition();
        const qs = new URLSearchParams({
          lat: String(coords.lat),
          lng: String(coords.lng),
        });
        const res = await apiFetch(`/geocoding/reverse?${qs.toString()}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as ReverseGeocodeResult;
        if (!cancelled) applyLocation(data, provinces);
      } catch {
        /* silent fallback */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [provinces, provinceId, applyLocation]);

  const useMyLocation = useCallback(async () => {
    setLocating(true);
    setError(null);
    try {
      const coords = await getCurrentPosition();
      const qs = new URLSearchParams({
        lat: String(coords.lat),
        lng: String(coords.lng),
      });
      const res = await apiFetch(`/geocoding/reverse?${qs.toString()}`);
      if (!res.ok) throw new Error("Konum çözümlenemedi.");
      const data = (await res.json()) as ReverseGeocodeResult;
      if (!applyLocation(data, provinces)) {
        throw new Error("Bulunduğunuz il henüz desteklenmiyor.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Konum alınamadı.");
    } finally {
      setLocating(false);
    }
  }, [applyLocation, provinces]);

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
    setLocationLabel(
      id ? (provinces.find((p) => p.id === id)?.name ?? null) : null,
    );
    try {
      if (id) localStorage.setItem(PROVINCE_KEY, id);
      else localStorage.removeItem(PROVINCE_KEY);
      localStorage.removeItem(DISTRICT_KEY);
    } catch {
      /* ignore */
    }
  }, [provinces]);

  const setDistrictIdPersist = useCallback(
    (id: string) => {
      setDistrictId(id);
      const province = provinces.find((p) => p.id === provinceId);
      if (province && id) {
        setLocationLabel(`${province.name} · …`);
      } else if (province) {
        setLocationLabel(province.name);
      }
      try {
        if (id) localStorage.setItem(DISTRICT_KEY, id);
        else localStorage.removeItem(DISTRICT_KEY);
      } catch {
        /* ignore */
      }
    },
    [provinceId, provinces],
  );

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
    locationLabel,
    locating,
    useMyLocation,
  };
}

export type EventsExploreState = ReturnType<typeof useEventsExplore>;
