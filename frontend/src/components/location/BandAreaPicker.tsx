"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { District, Province } from "@/lib/location-types";

export type BandAreaValue = {
  wholeProvinceIds: string[];
  districtIds: string[];
  partialProvinceIds: string[];
};

export const emptyBandArea = (): BandAreaValue => ({
  wholeProvinceIds: [],
  districtIds: [],
  partialProvinceIds: [],
});

const fieldsetClass =
  "rounded-xl border border-outline-variant/35 bg-surface-container-low/50 p-4";
const legendClass = "px-1 text-sm font-medium text-on-surface-variant";

type Props = {
  provinces: Province[];
  value: BandAreaValue;
  onChange: (next: BandAreaValue) => void;
};

export function bandAreaFromApi(b: {
  provinces?: { id: string }[];
  districts?: { id: string; provinceId: string }[];
}): BandAreaValue {
  const districtIds = (b.districts ?? []).map((d) => d.id);
  const partialProvinceIds = [
    ...new Set((b.districts ?? []).map((d) => d.provinceId)),
  ];
  return {
    wholeProvinceIds: (b.provinces ?? []).map((p) => p.id),
    districtIds,
    partialProvinceIds,
  };
}

export function formatBandPlayAreas(
  provinces: { name: string }[],
  districts: { name: string; provinceName: string }[],
): string {
  const parts: string[] = provinces.map((p) => `${p.name} (tüm ilçeler)`);
  const grouped = new Map<string, string[]>();
  for (const d of districts) {
    const list = grouped.get(d.provinceName) ?? [];
    list.push(d.name);
    grouped.set(d.provinceName, list);
  }
  for (const [provinceName, names] of grouped) {
    parts.push(`${provinceName} (${names.join(", ")})`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Bölge belirtilmedi";
}

function configuredProvinceIds(value: BandAreaValue): string[] {
  return [...new Set([...value.wholeProvinceIds, ...value.partialProvinceIds])];
}

type SectionProps = {
  province: Province;
  value: BandAreaValue;
  onChange: (next: BandAreaValue) => void;
  onDistrictsLoaded: (provinceId: string, districts: District[]) => void;
};

function ProvinceDistrictSection({
  province,
  value,
  onChange,
  onDistrictsLoaded,
}: SectionProps) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    (async () => {
      try {
        const res = await apiFetch(`/provinces/${province.id}/districts`);
        if (!res.ok) throw new Error("fetch failed");
        const data = (await res.json()) as District[];
        if (cancelled) return;
        setDistricts(data);
        onDistrictsLoaded(province.id, data);
      } catch {
        if (!cancelled) {
          setDistricts([]);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [province.id, onDistrictsLoaded]);

  const isWhole = value.wholeProvinceIds.includes(province.id);

  function toggleWhole() {
    if (isWhole) {
      onChange({
        ...value,
        wholeProvinceIds: value.wholeProvinceIds.filter((id) => id !== province.id),
      });
      return;
    }
    const provinceDistrictIds = new Set(districts.map((d) => d.id));
    onChange({
      wholeProvinceIds: [...value.wholeProvinceIds, province.id],
      districtIds: value.districtIds.filter((id) => !provinceDistrictIds.has(id)),
      partialProvinceIds: value.partialProvinceIds.filter((id) => id !== province.id),
    });
  }

  function toggleDistrict(district: District) {
    const has = value.districtIds.includes(district.id);
    if (has) {
      const nextDistrictIds = value.districtIds.filter((id) => id !== district.id);
      const stillPartial = districts.some((d) => nextDistrictIds.includes(d.id));
      onChange({
        wholeProvinceIds: value.wholeProvinceIds,
        districtIds: nextDistrictIds,
        partialProvinceIds: stillPartial
          ? value.partialProvinceIds
          : value.partialProvinceIds.filter((id) => id !== province.id),
      });
      return;
    }
    onChange({
      wholeProvinceIds: value.wholeProvinceIds.filter((id) => id !== province.id),
      districtIds: [...value.districtIds, district.id],
      partialProvinceIds: [...new Set([...value.partialProvinceIds, province.id])],
    });
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>{province.name} — ilçe seçimi</legend>
      <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-on-surface">
        <input
          type="checkbox"
          className="cursor-pointer"
          checked={isWhole}
          onChange={toggleWhole}
        />
        Tüm ilçelerde çalarım
      </label>
      {!isWhole ? (
        <div className="mt-3">
          {loading ? (
            <span className="text-sm text-on-surface-variant">İlçeler yükleniyor…</span>
          ) : loadError ? (
            <span className="text-sm text-red-400">
              İlçeler yüklenemedi. Sayfayı yenileyip tekrar deneyin.
            </span>
          ) : districts.length === 0 ? (
            <span className="text-sm text-on-surface-variant">
              Bu il için ilçe bulunamadı.
            </span>
          ) : (
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
              {districts.map((d) => {
                const checked = value.districtIds.includes(d.id);
                return (
                  <label
                    key={d.id}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      checked
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-outline-variant/40 text-on-surface-variant hover:border-outline-variant hover:text-on-surface"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleDistrict(d)}
                    />
                    {d.name}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </fieldset>
  );
}

export function BandAreaPicker({ provinces, value, onChange }: Props) {
  const districtsCache = useRef<Map<string, District[]>>(new Map());
  const [selectedProvinceIds, setSelectedProvinceIds] = useState<string[]>(() =>
    configuredProvinceIds(value),
  );

  const handleDistrictsLoaded = useCallback(
    (provinceId: string, districts: District[]) => {
      districtsCache.current.set(provinceId, districts);
    },
    [],
  );

  useEffect(() => {
    const fromValue = configuredProvinceIds(value);
    if (fromValue.length === 0) return;
    setSelectedProvinceIds((prev) => {
      const merged = new Set([...prev, ...fromValue]);
      return provinces
        .filter((p) => merged.has(p.id))
        .map((p) => p.id);
    });
  }, [value.wholeProvinceIds, value.partialProvinceIds, provinces]);

  function removeProvinceFromValue(provinceId: string) {
    const provinceDistrictIds = new Set(
      (districtsCache.current.get(provinceId) ?? []).map((d) => d.id),
    );
    onChange({
      wholeProvinceIds: value.wholeProvinceIds.filter((id) => id !== provinceId),
      districtIds: value.districtIds.filter((id) => !provinceDistrictIds.has(id)),
      partialProvinceIds: value.partialProvinceIds.filter((id) => id !== provinceId),
    });
  }

  function toggleProvince(provinceId: string) {
    if (selectedProvinceIds.includes(provinceId)) {
      setSelectedProvinceIds((ids) => ids.filter((id) => id !== provinceId));
      removeProvinceFromValue(provinceId);
      return;
    }
    setSelectedProvinceIds((ids) => [...ids, provinceId]);
  }

  const selectedProvinces = selectedProvinceIds
    .map((id) => provinces.find((p) => p.id === id))
    .filter((p): p is Province => p != null);

  return (
    <div className="space-y-4">
      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Çaldığınız iller (en az bir)</legend>
        <p className="mt-1 text-xs text-on-surface-variant">
          Birden fazla il seçebilirsiniz. Seçtiğiniz her il için aşağıda ilçe
          seçimi açılır.
        </p>
        <div className="mt-3 flex max-h-48 flex-wrap gap-2 overflow-y-auto">
          {provinces.map((p) => {
            const selected = selectedProvinceIds.includes(p.id);
            const whole = value.wholeProvinceIds.includes(p.id);
            const partial = value.partialProvinceIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleProvince(p.id)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selected
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-outline-variant/40 text-on-surface-variant hover:border-outline-variant hover:text-on-surface"
                }`}
              >
                {p.name}
                {whole ? " · tüm ilçeler" : partial ? " · seçili ilçeler" : ""}
              </button>
            );
          })}
        </div>
      </fieldset>

      {selectedProvinces.length > 0 ? (
        <div className="space-y-3">
          {selectedProvinces.map((province) => (
            <ProvinceDistrictSection
              key={province.id}
              province={province}
              value={value}
              onChange={onChange}
              onDistrictsLoaded={handleDistrictsLoaded}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant">
          İlçe seçmek için yukarıdan en az bir il seçin.
        </p>
      )}
    </div>
  );
}
