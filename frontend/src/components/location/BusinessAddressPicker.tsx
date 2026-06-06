"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getCurrentPosition } from "@/lib/geolocation";
import type {
  BusinessAddressValue,
  PlaceDetailsResult,
  PlacesSuggestion,
} from "@/lib/location-types";
import { ProvinceDistrictSelect } from "./ProvinceDistrictSelect";
import type { Province } from "@/lib/location-types";

const labelClass = "block text-sm font-medium text-on-surface-variant";
const inputClass =
  "mt-1.5 w-full rounded-xl border border-outline-variant/40 bg-surface-container/60 px-4 py-2.5 font-sans text-base text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

type Props = {
  provinces: Province[];
  value: BusinessAddressValue;
  onChange: (next: BusinessAddressValue) => void;
  disabled?: boolean;
};

function newSessionToken() {
  return crypto.randomUUID();
}

export function BusinessAddressPicker({
  provinces,
  value,
  onChange,
  disabled = false,
}: Props) {
  const listId = useId();
  const [query, setQuery] = useState(value.address);
  const [suggestions, setSuggestions] = useState<PlacesSuggestion[]>([]);
  const [sessionToken, setSessionToken] = useState(() => newSessionToken());
  const [placesAvailable, setPlacesAvailable] = useState(true);
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value.address);
  }, [value.address]);

  const applyGeocode = useCallback(
    (data: PlaceDetailsResult) => {
      if (!data.provinceId) {
        setErr("Adres desteklenen bir ile eşleşmedi. İli elle seçin.");
      } else {
        setErr(null);
      }
      onChange({
        address: data.address || data.displayName,
        provinceId: data.provinceId ?? "",
        districtId: data.districtId,
        latitude: data.lat,
        longitude: data.lng,
      });
      setQuery(data.address || data.displayName);
      setSuggestions([]);
      setSessionToken(newSessionToken());
    },
    [onChange],
  );

  const fetchSuggestions = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const trimmed = q.trim();
      if (trimmed.length < 2) {
        setSuggestions([]);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        try {
          const qs = new URLSearchParams({
            q: trimmed,
            sessionToken,
          });
          const res = await apiFetch(
            `/geocoding/places/autocomplete?${qs.toString()}`,
          );
          if (res.status === 503) {
            setPlacesAvailable(false);
            setSuggestions([]);
            return;
          }
          if (!res.ok) return;
          const data = (await res.json()) as PlacesSuggestion[];
          setPlacesAvailable(true);
          setSuggestions(data);
        } catch {
          setSuggestions([]);
        }
      }, 300);
    },
    [sessionToken],
  );

  async function pickSuggestion(placeId: string) {
    setErr(null);
    const qs = new URLSearchParams({ placeId, sessionToken });
    const res = await apiFetch(`/geocoding/places/details?${qs.toString()}`);
    if (!res.ok) {
      setErr("Adres detayı alınamadı.");
      return;
    }
    const data = (await res.json()) as PlaceDetailsResult;
    applyGeocode(data);
  }

  async function useMyLocation() {
    setErr(null);
    setLocating(true);
    try {
      const coords = await getCurrentPosition();
      const qs = new URLSearchParams({
        lat: String(coords.lat),
        lng: String(coords.lng),
      });
      const res = await apiFetch(`/geocoding/reverse?${qs.toString()}`);
      if (!res.ok) throw new Error("Konum çözümlenemedi.");
      const data = (await res.json()) as PlaceDetailsResult;
      applyGeocode({
        ...data,
        address: data.displayName,
        lat: coords.lat,
        lng: coords.lng,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Konum alınamadı.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor={`addr-${listId}`} className={labelClass}>
            Adres
          </label>
          <input
            id={`addr-${listId}`}
            type="text"
            disabled={disabled}
            value={query}
            onChange={(e) => {
              const next = e.target.value;
              setQuery(next);
              onChange({ ...value, address: next });
              if (placesAvailable) fetchSuggestions(next);
            }}
            onBlur={() => {
              setTimeout(() => setSuggestions([]), 150);
            }}
            className={inputClass}
            placeholder="Adres yazın veya konumunuzu kullanın"
            autoComplete="street-address"
          />
          {suggestions.length > 0 ? (
            <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-outline-variant/40 bg-surface-container-high shadow-xl">
              {suggestions.map((s) => (
                <li key={s.placeId}>
                  <button
                    type="button"
                    className="w-full cursor-pointer px-4 py-2.5 text-left text-sm text-on-surface transition-colors hover:bg-primary/10"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => void pickSuggestion(s.placeId)}
                  >
                    {s.description}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <button
          type="button"
          disabled={disabled || locating}
          onClick={() => void useMyLocation()}
          className="shrink-0 cursor-pointer rounded-full border border-outline-variant/50 px-4 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
        >
          {locating ? "Konum alınıyor…" : "Konumumu kullan"}
        </button>
      </div>

      <ProvinceDistrictSelect
        provinces={provinces}
        provinceId={value.provinceId}
        districtId={value.districtId ?? ""}
        onProvinceChange={(id) => onChange({ ...value, provinceId: id })}
        onDistrictChange={(id) =>
          onChange({ ...value, districtId: id || null })
        }
      />

      {err ? (
        <p className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
          {err}
        </p>
      ) : null}

      {!placesAvailable ? (
        <p className="text-xs text-on-surface-variant">
          Adres önerileri yapılandırılmamış; adresi yazabilir veya konumunuzu
          kullanabilirsiniz.
        </p>
      ) : null}
    </div>
  );
}
