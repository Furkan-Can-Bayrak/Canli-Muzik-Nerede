"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { BusinessAddressPicker } from "@/components/location/BusinessAddressPicker";
import {
  BandAreaPicker,
  emptyBandArea,
  type BandAreaValue,
} from "@/components/location/BandAreaPicker";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { uploadBandMedia } from "@/lib/band-media";
import { blurOnWheel, parseIntegerField } from "@/lib/number-input";
import { navigateAfterAuth } from "@/lib/auth-routes";
import type { BusinessAddressValue, Province } from "@/lib/location-types";
type Genre = { id: string; name: string };

type Tab = "customer" | "cafe" | "band";

const labelClass = "block text-sm font-medium text-on-surface-variant";
const inputClass =
  "mt-1.5 w-full rounded-xl border border-outline-variant/40 bg-surface-container/60 px-4 py-2.5 font-sans text-base text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20";
const fieldsetClass =
  "rounded-xl border border-outline-variant/35 bg-surface-container-low/50 p-4";
const legendClass = "px-1 text-sm font-medium text-on-surface-variant";

export default function RegisterPage() {
  const router = useRouter();
  const {
    ready,
    user,
    registerCustomer,
    registerCafe,
    registerBand,
  } = useAuth();
  const [tab, setTab] = useState<Tab>("customer");
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [cafeName, setCafeName] = useState("");
  const [cafeLocation, setCafeLocation] = useState<BusinessAddressValue>({
    address: "",
    provinceId: "",
    districtId: null,
    latitude: null,
    longitude: null,
  });
  const [cafePhone, setCafePhone] = useState("");
  const [cafeDesc, setCafeDesc] = useState("");

  const [bandName, setBandName] = useState("");
  const [memberCount, setMemberCount] = useState("3");
  const [bandPhone, setBandPhone] = useState("");
  const [basePrice, setBasePrice] = useState("0");
  const [bandDesc, setBandDesc] = useState("");
  const [bandArea, setBandArea] = useState<BandAreaValue>(emptyBandArea());
  const [bandGenreIds, setBandGenreIds] = useState<Set<string>>(new Set());
  const [bandCoverFile, setBandCoverFile] = useState<File | null>(null);
  const [bandCoverPreview, setBandCoverPreview] = useState<string | null>(null);
  const [bandVideoFile, setBandVideoFile] = useState<File | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rp, rg] = await Promise.all([
          apiFetch("/provinces"),
          apiFetch("/genres/catalog"),
        ]);
        if (!rp.ok || !rg.ok) throw new Error();
        const [pList, gList] = await Promise.all([
          rp.json() as Promise<Province[]>,
          rg.json() as Promise<Genre[]>,
        ]);
        if (!cancelled) {
          setProvinces(pList);
          setGenres(gList);
        }
      } catch {
        /* optional — forms still work if lists empty */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const redirectedRef = useRef(false);
  const redirecting = ready && Boolean(user) && !pending;

  useEffect(() => {
    if (!user) {
      redirectedRef.current = false;
      return;
    }
    if (!ready || pending || redirectedRef.current) return;
    redirectedRef.current = true;
    navigateAfterAuth(router, user.role);
  }, [ready, user, pending, router]);

  if (redirecting) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-on-surface-variant">
        Yönlendiriliyorsunuz…
      </div>
    );
  }

  function toggleId(set: Set<string>, id: string, on: boolean) {
    const next = new Set(set);
    if (on) next.add(id);
    else next.delete(id);
    return next;
  }

  function onBandVideoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setBandVideoFile(null);
      return;
    }
    const ok =
      file.type.startsWith("video/") ||
      [".mp4", ".webm", ".mov"].some((ext) =>
        file.name.toLowerCase().endsWith(ext),
      );
    if (!ok) {
      setError("Video MP4, WebM veya MOV olmalıdır.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Video en fazla 50 MB olabilir.");
      return;
    }
    setError(null);
    setBandVideoFile(file);
  }

  function onBandCoverChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setBandCoverFile(null);
      setBandCoverPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Kapak görseli JPEG, PNG, WebP veya GIF olmalıdır.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Görsel en fazla 5 MB olabilir.");
      return;
    }
    setError(null);
    setBandCoverFile(file);
    setBandCoverPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      let registeredUser;
      if (tab === "customer") {
        registeredUser = await registerCustomer(email, password);
      } else if (tab === "cafe") {
        if (!cafeLocation.provinceId) throw new Error("İl seçin.");
        if (cafeLocation.address.trim().length < 5)
          throw new Error("Adres en az 5 karakter olmalıdır.");
        registeredUser = await registerCafe({
          email,
          password,
          name: cafeName,
          provinceId: cafeLocation.provinceId,
          districtId: cafeLocation.districtId ?? undefined,
          address: cafeLocation.address,
          latitude: cafeLocation.latitude ?? undefined,
          longitude: cafeLocation.longitude ?? undefined,
          phone: cafePhone || undefined,
          description: cafeDesc || undefined,
        });
      } else {
        if (
          bandArea.wholeProvinceIds.length === 0 &&
          bandArea.districtIds.length === 0
        )
          throw new Error("En az bir il veya ilçe seçmelisiniz.");
        if (bandGenreIds.size === 0)
          throw new Error("En az bir müzik türü seçmelisiniz.");
        const mc = parseIntegerField(memberCount);
        const bp = parseIntegerField(basePrice);
        if (!Number.isFinite(mc) || mc < 1)
          throw new Error("Üye sayısı en az 1 olmalıdır.");
        if (!Number.isFinite(bp) || bp < 0)
          throw new Error("Taban fiyat 0 veya üzeri olmalıdır.");
        registeredUser = await registerBand({
          email,
          password,
          bandName,
          memberCount: mc,
          phone: bandPhone,
          basePrice: bp,
          description: bandDesc || undefined,
          provinceIds:
            bandArea.wholeProvinceIds.length > 0
              ? [...bandArea.wholeProvinceIds]
              : undefined,
          districtIds:
            bandArea.districtIds.length > 0
              ? [...bandArea.districtIds]
              : undefined,
          genreIds: [...bandGenreIds],
        });
        const raw = localStorage.getItem("canli_muzik_auth");
        const accessToken = raw
          ? ((JSON.parse(raw) as { accessToken?: string }).accessToken ?? null)
          : null;
        if (accessToken) {
          if (bandCoverFile) {
            await uploadBandMedia(accessToken, bandCoverFile, "IMAGE");
          }
          if (bandVideoFile) {
            await uploadBandMedia(accessToken, bandVideoFile, "VIDEO");
          }
        }
      }
      navigateAfterAuth(router, registeredUser.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız.");
    } finally {
      setPending(false);
    }
  }

  const tabs: { id: Tab; label: string; hint: string }[] = [
    { id: "customer", label: "Ziyaretçi", hint: "Etkinlikleri keşfet" },
    { id: "cafe", label: "İşletme", hint: "Mekân ve etkinlik yönet" },
    { id: "band", label: "Grup", hint: "Profil ve iş birlikleri" },
  ];

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

      <div className="relative mx-auto w-full max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
            Hesap oluştur
          </h1>
          <p className="mt-3 text-base text-on-surface-variant">
            Zaten hesabınız var mı?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary underline-offset-4 transition-colors hover:underline"
            >
              Giriş yapın
            </Link>
          </p>
        </div>

        <div className="glass-card rounded-2xl border border-outline-variant/35 p-6 shadow-2xl md:p-8">
          <p className="mb-4 text-sm font-medium text-on-surface-variant">
            Hesap türünü seçin
          </p>
          <div className="flex gap-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low p-1.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex flex-1 cursor-pointer flex-col items-center rounded-lg px-2 py-2.5 text-center transition-all ${
                  tab === t.id
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-on-surface"
                }`}
              >
                <span className="text-sm font-semibold">{t.label}</span>
                <span
                  className={`mt-0.5 hidden text-[11px] leading-tight sm:block ${
                    tab === t.id
                      ? "text-on-primary/80"
                      : "text-on-surface-variant/70"
                  }`}
                >
                  {t.hint}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-5 rounded-xl border border-outline-variant/25 bg-surface-container-low/30 p-4 md:p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary/90">
                Giriş bilgileri
              </p>
              <div>
                <label htmlFor="reg-email" className={labelClass}>
                  E-posta
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="reg-password" className={labelClass}>
                  Şifre (en az 6 karakter)
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {tab === "cafe" ? (
              <div className="space-y-5 rounded-xl border border-outline-variant/25 bg-surface-container-low/30 p-4 md:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary/90">
                  İşletme bilgileri
                </p>
                <div>
                  <label htmlFor="cafeName" className={labelClass}>
                    Mekân adı
                  </label>
                  <input
                    id="cafeName"
                    type="text"
                    required
                    minLength={2}
                    value={cafeName}
                    onChange={(e) => setCafeName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <BusinessAddressPicker
                  provinces={provinces}
                  value={cafeLocation}
                  onChange={setCafeLocation}
                />
                <div>
                  <label htmlFor="cafePhone" className={labelClass}>
                    Telefon (isteğe bağlı)
                  </label>
                  <input
                    id="cafePhone"
                    type="tel"
                    value={cafePhone}
                    onChange={(e) => setCafePhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="cafeDesc" className={labelClass}>
                    Açıklama (isteğe bağlı)
                  </label>
                  <textarea
                    id="cafeDesc"
                    rows={3}
                    value={cafeDesc}
                    onChange={(e) => setCafeDesc(e.target.value)}
                    className={`${inputClass} resize-y`}
                  />
                </div>
              </div>
            ) : null}

            {tab === "band" ? (
              <div className="space-y-5 rounded-xl border border-outline-variant/25 bg-surface-container-low/30 p-4 md:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary/90">
                  Grup bilgileri
                </p>
                <div>
                  <label htmlFor="bandName" className={labelClass}>
                    Grup adı
                  </label>
                  <input
                    id="bandName"
                    type="text"
                    required
                    minLength={2}
                    value={bandName}
                    onChange={(e) => setBandName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="memberCount" className={labelClass}>
                      Üye sayısı
                    </label>
                    <input
                      id="memberCount"
                      type="number"
                      min={1}
                      step={1}
                      required
                      value={memberCount}
                      onChange={(e) => setMemberCount(e.target.value)}
                      onWheel={blurOnWheel}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="basePrice" className={labelClass}>
                      Taban fiyat (₺)
                    </label>
                    <input
                      id="basePrice"
                      type="number"
                      min={0}
                      step={1}
                      required
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      onWheel={blurOnWheel}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="bandPhone" className={labelClass}>
                    Telefon (işletmelere görünür)
                  </label>
                  <input
                    id="bandPhone"
                    type="tel"
                    required
                    value={bandPhone}
                    onChange={(e) => setBandPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="bandDesc" className={labelClass}>
                    Açıklama (isteğe bağlı)
                  </label>
                  <textarea
                    id="bandDesc"
                    rows={3}
                    value={bandDesc}
                    onChange={(e) => setBandDesc(e.target.value)}
                    className={`${inputClass} resize-y`}
                  />
                </div>
                <div>
                  <label htmlFor="bandCover" className={labelClass}>
                    Kapak görseli (isteğe bağlı)
                  </label>
                  <p className="mt-0.5 text-xs text-on-surface-variant/80">
                    Ana sayfadaki öne çıkan gruplar bölümünde görünür. En fazla
                    5 MB.
                  </p>
                  <input
                    id="bandCover"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={onBandCoverChange}
                    className={`${inputClass} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary`}
                  />
                  {bandCoverPreview ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-outline-variant/35">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bandCoverPreview}
                        alt="Kapak önizlemesi"
                        className="aspect-[4/5] w-full max-w-xs object-cover"
                      />
                    </div>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="bandVideo" className={labelClass}>
                    Performans videosu (isteğe bağlı)
                  </label>
                  <p className="mt-0.5 text-xs text-on-surface-variant/80">
                    Grup detay sayfasında herkes izleyebilir. En fazla 50 MB
                    (MP4, WebM, MOV).
                  </p>
                  <input
                    id="bandVideo"
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={onBandVideoChange}
                    className={`${inputClass} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary`}
                  />
                  {bandVideoFile ? (
                    <p className="mt-2 text-sm text-on-surface-variant">
                      Seçildi: {bandVideoFile.name}
                    </p>
                  ) : null}
                </div>
                <BandAreaPicker
                  provinces={provinces}
                  value={bandArea}
                  onChange={setBandArea}
                />
                <fieldset className={fieldsetClass}>
                  <legend className={legendClass}>
                    Türler (en az bir)
                  </legend>
                  <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                    {genres.map((g) => {
                      const checked = bandGenreIds.has(g.id);
                      return (
                        <label
                          key={g.id}
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
                            onChange={(e) =>
                              setBandGenreIds((s) =>
                                toggleId(s, g.id, e.target.checked),
                              )
                            }
                          />
                          {g.name}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending || !ready}
              className="w-full cursor-pointer rounded-full bg-primary py-3.5 text-base font-bold text-on-primary transition-transform hover:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Kaydediliyor…" : "Hesap oluştur"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
