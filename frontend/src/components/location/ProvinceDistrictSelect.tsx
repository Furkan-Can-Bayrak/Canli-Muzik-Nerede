"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { District, Province } from "@/lib/location-types";

const labelClass = "block text-sm font-medium text-on-surface-variant";
const selectClass =
  "mt-1.5 w-full cursor-pointer rounded-xl border border-outline-variant/40 bg-surface-container/60 px-4 py-2.5 font-sans text-base text-on-surface outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20 [color-scheme:dark]";

type Props = {
  provinces: Province[];
  provinceId: string;
  districtId: string;
  onProvinceChange: (id: string) => void;
  onDistrictChange: (id: string) => void;
  provinceLabel?: string;
  districtLabel?: string;
  emptyProvinceLabel?: string;
  /** Filtrelerde boş = tüm ilçeler; mekân adresinde tek ilçe zorunlu. */
  requireDistrict?: boolean;
  compact?: boolean;
  className?: string;
};

export function ProvinceDistrictSelect({
  provinces,
  provinceId,
  districtId,
  onProvinceChange,
  onDistrictChange,
  provinceLabel = "İl",
  districtLabel = "İlçe",
  emptyProvinceLabel = "Tüm iller",
  requireDistrict = false,
  compact = false,
  className = "",
}: Props) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  useEffect(() => {
    if (!provinceId) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    setLoadingDistricts(true);
    (async () => {
      try {
        const res = await apiFetch(`/provinces/${provinceId}/districts`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as District[];
        if (!cancelled) setDistricts(data);
      } catch {
        if (!cancelled) setDistricts([]);
      } finally {
        if (!cancelled) setLoadingDistricts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [provinceId]);

  const gridClass = compact
    ? "grid gap-3 sm:grid-cols-2"
    : "grid gap-4 sm:grid-cols-2";

  return (
    <div className={`${gridClass} ${className}`}>
      <div>
        <label className={labelClass}>{provinceLabel}</label>
        <select
          aria-label={provinceLabel}
          value={provinceId}
          onChange={(e) => onProvinceChange(e.target.value)}
          className={selectClass}
        >
          <option value="">{emptyProvinceLabel}</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>{districtLabel}</label>
        <select
          aria-label={districtLabel}
          value={districtId}
          onChange={(e) => onDistrictChange(e.target.value)}
          disabled={!provinceId || loadingDistricts}
          className={`${selectClass} disabled:opacity-50`}
        >
          <option value="">
            {!provinceId
              ? "Önce il seçin"
              : loadingDistricts
                ? "Yükleniyor…"
                : requireDistrict
                  ? "İlçe seçin"
                  : "Tüm ilçeler"}
          </option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
