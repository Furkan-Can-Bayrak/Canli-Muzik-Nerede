"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import {
  BandAreaPicker,
  bandAreaFromApi,
  emptyBandArea,
  type BandAreaValue,
} from "@/components/location/BandAreaPicker";
import { DeleteAccountButton } from "@/components/account/DeleteAccountButton";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { apiFetch } from "@/lib/api";
import {
  normalizeBandMedia,
  uploadBandMedia,
  type BandMediaItem,
} from "@/lib/band-media";
import type { Province } from "@/lib/location-types";
import { blurOnWheel } from "@/lib/number-input";

type Genre = { id: string; name: string };

type BandDistrict = {
  id: string;
  name: string;
  provinceId: string;
  provinceName: string;
};

type BandDetail = {
  id: string;
  bandName: string;
  memberCount: number;
  phone?: string;
  basePrice?: number;
  description: string | null;
  provinces: Province[];
  districts?: BandDistrict[];
  cities?: Province[];
  genres: { id: string; name: string }[];
  media?: BandMediaItem[];
};

type DraftEvent = {
  id: string;
  title: string | null;
  status: string;
  startAt: string | null;
  cafe: { name: string };
};

const labelClass = "block text-sm font-medium text-on-surface-variant";
const inputClass =
  "mt-1.5 w-full rounded-xl border border-outline-variant/40 bg-surface-container/60 px-4 py-2.5 font-sans text-base text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 [color-scheme:dark]";
const sectionClass =
  "glass-card rounded-2xl border border-outline-variant/35 p-5 shadow-xl md:p-6";
const sectionTitleClass =
  "font-display text-lg font-semibold text-on-surface md:text-xl";

function PanelSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="glass-card animate-pulse rounded-2xl border border-outline-variant/35 p-6"
        >
          <div className="h-6 w-40 rounded-lg bg-surface-container-high" />
          <div className="mt-4 space-y-3">
            <div className="h-11 rounded-xl bg-surface-container-high" />
            <div className="h-11 rounded-xl bg-surface-container-high" />
            <div className="h-24 rounded-xl bg-surface-container-high" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatEventDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

export default function BandPanelPage() {
  const router = useRouter();
  const { ready, token, user, logout } = useAuth();
  const toast = useToast();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [bandName, setBandName] = useState("");
  const [memberCount, setMemberCount] = useState("3");
  const [phone, setPhone] = useState("");
  const [basePrice, setBasePrice] = useState("0");
  const [description, setDescription] = useState("");
  const [bandArea, setBandArea] = useState<BandAreaValue>(emptyBandArea());
  const [genreIds, setGenreIds] = useState<string[]>([]);
  const [media, setMedia] = useState<BandMediaItem[]>([]);
  const [mediaUploading, setMediaUploading] = useState(false);

  const [draftEvents, setDraftEvents] = useState<DraftEvent[]>([]);

  const loadDrafts = useCallback(async () => {
    if (!token || !user?.id) return;
    const qs = new URLSearchParams({ bandId: user.id, take: "80" });
    const res = await apiFetch(`/events?${qs}`, { token });
    if (!res.ok) return;
    const data = (await res.json()) as DraftEvent[];
    setDraftEvents(data.filter((e) => e.status === "DRAFT"));
  }, [token, user]);

  useEffect(() => {
    if (!ready) return;
    if (!token || user?.role !== "BAND") {
      router.replace("/login?next=/panel/band");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [provincesRes, genresRes, bandRes] = await Promise.all([
          apiFetch("/provinces"),
          apiFetch("/genres/catalog"),
          apiFetch(`/bands/${user.id}`, { token }),
        ]);
        if (!provincesRes.ok || !genresRes.ok || !bandRes.ok) {
          throw new Error("load");
        }
        const p = (await provincesRes.json()) as Province[];
        const g = (await genresRes.json()) as Genre[];
        const b = (await bandRes.json()) as BandDetail;
        if (cancelled) return;
        setProvinces(p);
        setGenres(g);
        setBandName(b.bandName);
        setMemberCount(String(b.memberCount));
        setPhone(b.phone ?? "");
        setBasePrice(String(b.basePrice ?? 0));
        setDescription(b.description ?? "");
        setBandArea(
          bandAreaFromApi({
            provinces: b.provinces ?? b.cities,
            districts: b.districts,
          }),
        );
        setGenreIds(b.genres.map((x) => x.id));
        setMedia(normalizeBandMedia(b.media));
        await loadDrafts();
      } catch {
        if (!cancelled) setErr("Panel yüklenemedi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token, user?.role, user?.id, router, loadDrafts]);

  async function publishDraft(id: string) {
    setErr(null);
    const res = await apiFetch(`/events/${id}/publish`, {
      method: "POST",
      token,
    });
    if (!res.ok) {
      setErr("Yayınlanamadı.");
      return;
    }
    setMsg("Etkinlik yayında.");
    await loadDrafts();
  }

  function toggleGenre(id: string) {
    setGenreIds((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
  }

  async function onMediaSelected(
    e: ChangeEvent<HTMLInputElement>,
    type: "IMAGE" | "VIDEO",
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !token) return;
    setMsg(null);
    setErr(null);
    setMediaUploading(true);
    try {
      const item = await uploadBandMedia(token, file, type);
      setMedia((list) => [...list, item]);
      setMsg(type === "IMAGE" ? "Görsel yüklendi." : "Video yüklendi.");
    } catch (uploadErr) {
      setErr(
        uploadErr instanceof Error ? uploadErr.message : "Yükleme başarısız.",
      );
    } finally {
      setMediaUploading(false);
    }
  }

  async function removeMedia(mediaId: string) {
    if (!token) return;
    setMsg(null);
    setErr(null);
    const res = await apiFetch(`/bands/me/media/${mediaId}`, {
      method: "DELETE",
      token,
    });
    if (!res.ok) {
      setErr("Medya silinemedi.");
      return;
    }
    setMedia((list) => list.filter((m) => m.id !== mediaId));
    setMsg("Medya silindi.");
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (
      (bandArea.wholeProvinceIds.length === 0 &&
        bandArea.districtIds.length === 0) ||
      genreIds.length === 0
    ) {
      setErr("En az bir il/ilçe ve bir müzik türü seçin.");
      return;
    }
    const res = await apiFetch("/bands/me", {
      method: "PATCH",
      token,
      body: JSON.stringify({
        bandName,
        memberCount: Number.parseInt(memberCount, 10),
        phone,
        basePrice: Number.parseInt(basePrice, 10),
        description: description || undefined,
        provinceIds:
          bandArea.wholeProvinceIds.length > 0
            ? bandArea.wholeProvinceIds
            : undefined,
        districtIds:
          bandArea.districtIds.length > 0 ? bandArea.districtIds : undefined,
        genreIds,
      }),
    });
    if (!res.ok) {
      setErr("Profil kaydedilemedi.");
      return;
    }
    toast.success("Profil güncellendi.");
  }

  if (!ready || !token || user?.role !== "BAND") {
    return (
      <div className="mx-auto max-w-3xl px-margin-mobile py-16 text-center text-sm text-on-surface-variant md:px-margin-desktop">
        Yönlendiriliyorsunuz…
      </div>
    );
  }

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

      <div className="relative mx-auto w-full max-w-3xl space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/90">
            Grup
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
            {bandName.trim() || "Grup paneli"}
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Profilinizi güncelleyin, taslak etkinlikleri onaylayın.
          </p>
        </header>

        {loading ? (
          <PanelSkeleton />
        ) : (
          <>
            {msg ? (
              <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                {msg}
              </p>
            ) : null}
            {err ? (
              <p className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
                {err}
              </p>
            ) : null}

            <section className={sectionClass}>
              <h2 className={sectionTitleClass}>Grup profili</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                İşletmelerin ve ziyaretçilerin gördüğü bilgiler
              </p>
              <form onSubmit={saveProfile} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="band-name" className={labelClass}>
                    Grup adı
                  </label>
                  <input
                    id="band-name"
                    required
                    value={bandName}
                    onChange={(e) => setBandName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="member-count" className={labelClass}>
                      Üye sayısı
                    </label>
                    <input
                      id="member-count"
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
                    <label htmlFor="base-price" className={labelClass}>
                      Taban fiyat (₺)
                    </label>
                    <input
                      id="base-price"
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
                  <label htmlFor="band-phone" className={labelClass}>
                    Telefon
                  </label>
                  <p className="mt-0.5 text-xs text-on-surface-variant/80">
                    İşletmelerle paylaşım için kullanılır.
                  </p>
                  <input
                    id="band-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="band-desc" className={labelClass}>
                    Açıklama
                  </label>
                  <textarea
                    id="band-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-y`}
                  />
                </div>
                <BandAreaPicker
                  provinces={provinces}
                  value={bandArea}
                  onChange={setBandArea}
                />
                <fieldset className="rounded-xl border border-outline-variant/35 bg-surface-container-low/50 p-4">
                  <legend className="px-1 text-sm font-medium text-on-surface-variant">
                    Türler (en az bir)
                  </legend>
                  <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                    {genres.map((g) => {
                      const checked = genreIds.includes(g.id);
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
                            onChange={() => toggleGenre(g.id)}
                          />
                          {g.name}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-transform hover:scale-[0.98]"
                >
                  Profili kaydet
                </button>
              </form>
            </section>

            <section className={sectionClass}>
              <h2 className={sectionTitleClass}>Görseller ve performans videoları</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Kapak görseli ana sayfada öne çıkan gruplar bölümünde görünür.
                Videoları ziyaretçiler ve işletmeler grup detay sayfasında
                izleyebilir.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-outline-variant/50 px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={mediaUploading}
                    onChange={(e) => void onMediaSelected(e, "IMAGE")}
                  />
                  {mediaUploading ? "Yükleniyor…" : "Görsel ekle"}
                </label>
                <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-outline-variant/50 px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="sr-only"
                    disabled={mediaUploading}
                    onChange={(e) => void onMediaSelected(e, "VIDEO")}
                  />
                  {mediaUploading ? "Yükleniyor…" : "Performans videosu ekle"}
                </label>
                <Link
                  href={`/bands/${user.id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary/40 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  Profili önizle
                </Link>
              </div>
              {media.length === 0 ? (
                <p className="mt-5 rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low/40 px-6 py-8 text-center text-sm text-on-surface-variant">
                  Henüz görsel veya video eklenmedi.
                </p>
              ) : (
                <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                  {media.map((m) => (
                    <li
                      key={m.id}
                      className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low/40"
                    >
                      {m.type === "VIDEO" ? (
                        <video
                          src={m.url}
                          className="aspect-video w-full bg-black object-cover"
                          controls
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.url}
                          alt=""
                          className="aspect-[4/5] w-full object-cover"
                        />
                      )}
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="text-xs font-medium text-on-surface-variant">
                          {m.type === "VIDEO" ? "Performans videosu" : "Kapak görseli"}
                        </span>
                        <button
                          type="button"
                          onClick={() => void removeMedia(m.id)}
                          className="text-xs font-semibold text-error transition-colors hover:underline"
                        >
                          Sil
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={sectionClass}>
              <h2 className={sectionTitleClass}>
                Onay bekleyen etkinlikler
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                İşletme sizi etkinliğe eklediğinde kayıt taslak olarak oluşur.
                Yayına aldığınızda müşteriler keşif listesinde görür.
              </p>

              {draftEvents.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low/40 px-6 py-10 text-center">
                  <p className="font-medium text-on-surface">
                    Şu an onay bekleyen taslak yok
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    İşletmeler sizi etkinliklerine eklediğinde burada görünür.
                  </p>
                </div>
              ) : (
                <ul className="mt-5 space-y-3">
                  {draftEvents.map((d) => {
                    const when = formatEventDate(d.startAt);
                    return (
                      <li
                        key={d.id}
                        className="rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-4 transition-colors hover:border-outline-variant/50"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-on-surface">
                                {d.title?.trim() || "İsimsiz etkinlik"}
                              </span>
                              <span className="rounded-full border border-secondary/40 bg-secondary/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
                                Taslak
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-on-surface-variant">
                              {d.cafe.name}
                            </p>
                            {when ? (
                              <p className="mt-1 text-xs text-on-surface-variant/80">
                                {when}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/events/${d.id}`}
                              className="rounded-full border border-outline-variant/50 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              Önizle
                            </Link>
                            <button
                              type="button"
                              onClick={() => void publishDraft(d.id)}
                              className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-on-primary transition-transform hover:scale-[0.98]"
                            >
                              Yayınla
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/25 pt-6 pb-4">
              <DeleteAccountButton />
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.replace("/");
                }}
                className="text-sm font-medium text-on-surface-variant transition-colors hover:text-error"
              >
                Çıkış yap
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
