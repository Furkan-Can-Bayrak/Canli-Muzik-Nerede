"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { BusinessAddressPicker } from "@/components/location/BusinessAddressPicker";
import { DeleteAccountButton } from "@/components/account/DeleteAccountButton";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { apiFetch } from "@/lib/api";
import { blurOnWheel, parseIntegerField } from "@/lib/number-input";
import {
  normalizeCoverUrl,
  removeCafeCover,
  uploadCafeCover,
} from "@/lib/cafe-cover";
import {
  normalizePosterUrl,
  removeEventPoster,
  uploadEventPoster,
} from "@/lib/event-poster";
import type { BusinessAddressValue, Province } from "@/lib/location-types";

type BandOption = {
  id: string;
  bandName: string;
  phone?: string;
};

type EventRow = {
  id: string;
  title: string | null;
  address: string;
  description: string | null;
  provinceId: string;
  districtId?: string | null;
  startAt: string | null;
  price: number | null;
  bandId: string | null;
  status?: string;
  posterUrl?: string | null;
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

export default function CafePanelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectBandId = searchParams.get("bandId");
  const appliedBandPreselect = useRef<string | null>(null);
  const { ready, token, user, logout } = useAuth();
  const toast = useToast();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [bands, setBands] = useState<BandOption[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [cafeName, setCafeName] = useState("");
  const [cafeLocation, setCafeLocation] = useState<BusinessAddressValue>({
    address: "",
    provinceId: "",
    districtId: null,
    latitude: null,
    longitude: null,
  });
  const [cafePhone, setCafePhone] = useState("");
  const [cafeDescription, setCafeDescription] = useState("");
  const [cafeCoverFile, setCafeCoverFile] = useState<File | null>(null);
  const [cafeCoverPreview, setCafeCoverPreview] = useState<string | null>(null);
  const [cafeCoverRemoved, setCafeCoverRemoved] = useState(false);
  const cafeCoverObjectUrl = useRef<string | null>(null);

  const [evTitle, setEvTitle] = useState("");
  const [evProvinceId, setEvProvinceId] = useState("");
  const [evDistrictId, setEvDistrictId] = useState("");
  const [evDescription, setEvDescription] = useState("");
  const [evStart, setEvStart] = useState("");
  const [evPrice, setEvPrice] = useState("");
  const [evBandId, setEvBandId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [evPosterFile, setEvPosterFile] = useState<File | null>(null);
  const [evPosterPreview, setEvPosterPreview] = useState<string | null>(null);
  const [evPosterRemoved, setEvPosterRemoved] = useState(false);
  const evPosterObjectUrl = useRef<string | null>(null);

  const loadBands = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch("/bands", { token });
    if (!res.ok) return;
    const data = (await res.json()) as {
      id: string;
      bandName: string;
      phone?: string;
    }[];
    setBands(data);
  }, [token]);

  const loadEvents = useCallback(async () => {
    if (!token || !user?.id) return;
    const qs = new URLSearchParams({ cafeId: user.id, take: "100" });
    const res = await apiFetch(`/events?${qs}`, { token });
    if (!res.ok) return;
    const data = (await res.json()) as EventRow[];
    setEvents(data);
  }, [token, user]);

  useEffect(() => {
    if (!ready) return;
    if (!token || user?.role !== "CAFE") {
      router.replace("/login?next=/panel/cafe");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [provincesRes, meRes] = await Promise.all([
          apiFetch("/provinces"),
          apiFetch("/auth/me", { token }),
        ]);
        if (!provincesRes.ok || !meRes.ok) throw new Error("Veri alınamadı.");
        const p = (await provincesRes.json()) as Province[];
        const me = (await meRes.json()) as {
          cafeProfile: {
            name: string;
            provinceId: string;
            districtId: string | null;
            address: string;
            latitude: number | null;
            longitude: number | null;
            phone: string | null;
            description: string | null;
            coverUrl: string | null;
          } | null;
        };
        if (cancelled) return;
        setProvinces(p);
        if (me.cafeProfile) {
          setCafeName(me.cafeProfile.name);
          setCafeLocation({
            address: me.cafeProfile.address,
            provinceId: me.cafeProfile.provinceId,
            districtId: me.cafeProfile.districtId,
            latitude: me.cafeProfile.latitude,
            longitude: me.cafeProfile.longitude,
          });
          setCafePhone(me.cafeProfile.phone ?? "");
          setCafeDescription(me.cafeProfile.description ?? "");
          revokeCafeCoverObjectUrl();
          setCafeCoverFile(null);
          setCafeCoverRemoved(false);
          if (me.cafeProfile.coverUrl) {
            setCafeCoverPreview(normalizeCoverUrl(me.cafeProfile.coverUrl));
          } else {
            setCafeCoverPreview(null);
          }
          setEvProvinceId(me.cafeProfile.provinceId);
          setEvDistrictId(me.cafeProfile.districtId ?? "");
        }
        await loadBands();
        await loadEvents();
      } catch {
        if (!cancelled) setErr("Panel yüklenemedi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token, user?.role, user?.id, router, loadBands, loadEvents]);

  useEffect(() => {
    if (!preselectBandId || loading || bands.length === 0) return;
    if (appliedBandPreselect.current === preselectBandId) return;
    if (!bands.some((b) => b.id === preselectBandId)) return;

    appliedBandPreselect.current = preselectBandId;
    setEditingId(null);
    setEvBandId(preselectBandId);

    requestAnimationFrame(() => {
      document.getElementById("cafe-event-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [preselectBandId, bands, loading]);

  function revokeCafeCoverObjectUrl() {
    if (cafeCoverObjectUrl.current) {
      URL.revokeObjectURL(cafeCoverObjectUrl.current);
      cafeCoverObjectUrl.current = null;
    }
  }

  function onCafeCoverSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    revokeCafeCoverObjectUrl();
    const url = URL.createObjectURL(file);
    cafeCoverObjectUrl.current = url;
    setCafeCoverFile(file);
    setCafeCoverPreview(url);
    setCafeCoverRemoved(false);
  }

  function removeCafeCoverSelection() {
    revokeCafeCoverObjectUrl();
    setCafeCoverFile(null);
    setCafeCoverPreview(null);
    setCafeCoverRemoved(true);
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (!cafeLocation.provinceId) {
      setErr("İl seçin.");
      return;
    }
    if (!cafeLocation.districtId) {
      setErr("İlçe seçin.");
      return;
    }
    if (cafeLocation.address.trim().length < 5) {
      setErr("Adres en az 5 karakter olmalıdır.");
      return;
    }
    const res = await apiFetch("/cafes/me", {
      method: "PATCH",
      token,
      body: JSON.stringify({
        name: cafeName,
        provinceId: cafeLocation.provinceId,
        districtId: cafeLocation.districtId ?? undefined,
        address: cafeLocation.address,
        latitude: cafeLocation.latitude ?? undefined,
        longitude: cafeLocation.longitude ?? undefined,
        phone: cafePhone || undefined,
        description: cafeDescription || undefined,
      }),
    });
    if (!res.ok) {
      setErr("Profil kaydedilemedi.");
      return;
    }
    if (token && (cafeCoverRemoved || cafeCoverFile)) {
      try {
        if (cafeCoverRemoved) {
          await removeCafeCover(token);
        }
        if (cafeCoverFile) {
          const coverUrl = await uploadCafeCover(token, cafeCoverFile);
          setCafeCoverPreview(coverUrl);
        }
        revokeCafeCoverObjectUrl();
        setCafeCoverFile(null);
        setCafeCoverRemoved(false);
      } catch (coverErr) {
        setErr(
          coverErr instanceof Error
            ? coverErr.message
            : "Kapak görseli işlenemedi.",
        );
        return;
      }
    }
    toast.success("Profil güncellendi.");
  }

  function revokePosterObjectUrl() {
    if (evPosterObjectUrl.current) {
      URL.revokeObjectURL(evPosterObjectUrl.current);
      evPosterObjectUrl.current = null;
    }
  }

  function clearPosterState() {
    revokePosterObjectUrl();
    setEvPosterFile(null);
    setEvPosterPreview(null);
    setEvPosterRemoved(false);
  }

  function resetEventForm() {
    setEditingId(null);
    setEvTitle("");
    setEvDescription("");
    setEvStart("");
    setEvPrice("");
    setEvBandId("");
    setEvProvinceId(cafeLocation.provinceId);
    setEvDistrictId(cafeLocation.districtId ?? "");
    clearPosterState();
  }

  function onPosterSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    revokePosterObjectUrl();
    const url = URL.createObjectURL(file);
    evPosterObjectUrl.current = url;
    setEvPosterFile(file);
    setEvPosterPreview(url);
    setEvPosterRemoved(false);
  }

  function removePoster() {
    revokePosterObjectUrl();
    setEvPosterFile(null);
    setEvPosterPreview(null);
    setEvPosterRemoved(true);
  }

  function startEdit(ev: EventRow) {
    clearPosterState();
    setEditingId(ev.id);
    setEvTitle(ev.title ?? "");
    setEvProvinceId(ev.provinceId);
    setEvDistrictId(ev.districtId ?? "");
    setEvDescription(ev.description ?? "");
    setEvStart(
      ev.startAt ? new Date(ev.startAt).toISOString().slice(0, 16) : "",
    );
    setEvPrice(ev.price != null ? String(ev.price) : "");
    setEvBandId(ev.bandId ?? "");
    if (ev.posterUrl) {
      setEvPosterPreview(normalizePosterUrl(ev.posterUrl));
    }
  }

  useEffect(() => {
    return () => {
      revokeCafeCoverObjectUrl();
      revokePosterObjectUrl();
    };
  }, []);

  async function saveEvent(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    const eventAddress = cafeLocation.address.trim();
    if (eventAddress.length < 5) {
      setErr(
        "Etkinlik için önce işletme profilinize geçerli bir adres kaydedin.",
      );
      return;
    }
    const priceRaw = evPrice.trim();
    const body: Record<string, unknown> = {
      provinceId: cafeLocation.provinceId || evProvinceId,
      districtId: cafeLocation.districtId ?? (evDistrictId || undefined),
      address: eventAddress,
      title: evTitle || undefined,
      description: evDescription || undefined,
      startAt: evStart ? new Date(evStart).toISOString() : undefined,
      price: priceRaw === "" ? undefined : parseIntegerField(priceRaw),
      bandId: evBandId || undefined,
    };
    const res = editingId
      ? await apiFetch(`/events/${editingId}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(body),
        })
      : await apiFetch("/events", {
          method: "POST",
          token,
          body: JSON.stringify(body),
        });
    if (!res.ok) {
      setErr(
        editingId ? "Etkinlik güncellenemedi." : "Etkinlik oluşturulamadı.",
      );
      return;
    }
    const saved = (await res.json()) as { id: string };
    const eventId = editingId ?? saved.id;

    if (token && (evPosterRemoved || evPosterFile)) {
      try {
        if (evPosterRemoved && editingId) {
          await removeEventPoster(token, eventId);
        }
        if (evPosterFile) {
          await uploadEventPoster(token, eventId, evPosterFile);
        }
      } catch (posterErr) {
        setErr(
          posterErr instanceof Error
            ? posterErr.message
            : "Kapak görseli işlenemedi.",
        );
        await loadEvents();
        return;
      }
    }

    if (!editingId && evBandId.trim()) {
      setMsg(
        "Taslak oluşturuldu. Grup yayına aldığında müşteriler listede görür.",
      );
    } else {
      setMsg(editingId ? "Etkinlik güncellendi." : "Etkinlik oluşturuldu.");
    }
    resetEventForm();
    await loadEvents();
  }

  async function removeEvent(id: string) {
    if (!confirm("Bu etkinliği silmek istiyor musunuz?")) return;
    setErr(null);
    const res = await apiFetch(`/events/${id}`, { method: "DELETE", token });
    if (!res.ok) {
      setErr("Silinemedi.");
      return;
    }
    setMsg("Etkinlik silindi.");
    if (editingId === id) resetEventForm();
    await loadEvents();
  }

  if (!ready || !token || user?.role !== "CAFE") {
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
            İşletme
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
            {cafeName.trim() || "İşletme paneli"}
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Mekân profilinizi ve etkinliklerinizi buradan yönetin.
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
              <h2 className={sectionTitleClass}>Mekân profili</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Ziyaretçilerin gördüğü işletme bilgileri
              </p>
              <form onSubmit={saveProfile} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="cafe-name" className={labelClass}>
                    Mekân adı
                  </label>
                  <input
                    id="cafe-name"
                    required
                    value={cafeName}
                    onChange={(e) => setCafeName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="cafe-cover" className={labelClass}>
                    Kapak görseli (isteğe bağlı)
                  </label>
                  <p className="mt-0.5 text-xs text-on-surface-variant/80">
                    Mekân listesinde ve profil sayfasında görünür. En fazla 5 MB
                    (JPEG, PNG, WebP, GIF).
                  </p>
                  <input
                    id="cafe-cover"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={onCafeCoverSelected}
                    className={`${inputClass} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary`}
                  />
                  {cafeCoverPreview ? (
                    <div className="mt-3 space-y-2">
                      <div className="overflow-hidden rounded-xl border border-outline-variant/35">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cafeCoverPreview}
                          alt="Kapak önizlemesi"
                          className="aspect-[16/9] w-full max-w-md object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeCafeCoverSelection}
                        className="text-sm font-medium text-error transition-colors hover:text-error/80"
                      >
                        Kapak görselini kaldır
                      </button>
                    </div>
                  ) : null}
                </div>
                <BusinessAddressPicker
                  provinces={provinces}
                  value={cafeLocation}
                  onChange={setCafeLocation}
                />
                <div>
                  <label htmlFor="cafe-phone" className={labelClass}>
                    Telefon
                  </label>
                  <p className="mt-0.5 text-xs text-on-surface-variant/80">
                    Genelde yalnızca siz ve anlaştığınız gruplar görür.
                  </p>
                  <input
                    id="cafe-phone"
                    type="tel"
                    value={cafePhone}
                    onChange={(e) => setCafePhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="cafe-desc" className={labelClass}>
                    Açıklama
                  </label>
                  <textarea
                    id="cafe-desc"
                    value={cafeDescription}
                    onChange={(e) => setCafeDescription(e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-y`}
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-transform hover:scale-[0.98]"
                >
                  Profili kaydet
                </button>
              </form>
            </section>

            <section id="cafe-event-form" className={sectionClass}>
              <h2 className={sectionTitleClass}>
                {editingId ? "Etkinliği düzenle" : "Yeni etkinlik"}
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {editingId
                  ? "Mevcut etkinliğin bilgilerini güncelleyin."
                  : "Canlı müzik etkinliği oluşturun veya grupla taslak başlatın."}
              </p>
              <form onSubmit={saveEvent} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="ev-title" className={labelClass}>
                    Başlık
                  </label>
                  <input
                    id="ev-title"
                    value={evTitle}
                    onChange={(e) => setEvTitle(e.target.value)}
                    placeholder="Örn. Cuma akşamı canlı müzik"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="ev-poster" className={labelClass}>
                    Kapak görseli (isteğe bağlı)
                  </label>
                  <p className="mt-0.5 text-xs text-on-surface-variant/80">
                    Etkinlik listesinde ve detay sayfasında görünür. En fazla 5
                    MB (JPEG, PNG, WebP, GIF).
                  </p>
                  <input
                    id="ev-poster"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={onPosterSelected}
                    className={`${inputClass} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary`}
                  />
                  {evPosterPreview ? (
                    <div className="mt-3 space-y-2">
                      <div className="overflow-hidden rounded-xl border border-outline-variant/35">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={evPosterPreview}
                          alt="Kapak önizlemesi"
                          className="aspect-[16/9] w-full max-w-md object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removePoster}
                        className="text-sm font-medium text-error transition-colors hover:text-error/80"
                      >
                        Kapak görselini kaldır
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ev-start" className={labelClass}>
                      Tarih
                    </label>
                    <input
                      id="ev-start"
                      type="datetime-local"
                      value={evStart}
                      onChange={(e) => setEvStart(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="ev-price" className={labelClass}>
                      Liste fiyatı (₺)
                    </label>
                    <input
                      id="ev-price"
                      type="number"
                      min={0}
                      value={evPrice}
                      onChange={(e) => setEvPrice(e.target.value)}
                      onWheel={blurOnWheel}
                      placeholder="Boş bırakılabilir"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="ev-band" className={labelClass}>
                    Grup (isteğe bağlı)
                  </label>
                  <select
                    id="ev-band"
                    value={evBandId}
                    onChange={(e) => setEvBandId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Grup seçilmedi</option>
                    {bands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bandName}
                        {b.phone ? ` · ${b.phone}` : ""}
                      </option>
                    ))}
                  </select>
                  {evBandId ? (
                    <p className="mt-2 rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-2 text-xs text-on-surface-variant">
                      Grup seçildiğinde etkinlik{" "}
                      <strong className="text-secondary">taslak</strong> olarak
                      kaydedilir; grup onayından sonra yayına geçer.
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="ev-desc" className={labelClass}>
                    Açıklama
                  </label>
                  <textarea
                    id="ev-desc"
                    value={evDescription}
                    onChange={(e) => setEvDescription(e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-y`}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-transform hover:scale-[0.98]"
                  >
                    {editingId
                      ? "Güncelle"
                      : evBandId.trim()
                        ? "Taslak oluştur"
                        : "Yayınla"}
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={() => resetEventForm()}
                      className="rounded-full border border-outline-variant/50 px-6 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      İptal
                    </button>
                  ) : null}
                </div>
              </form>
            </section>

            <section className={sectionClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className={sectionTitleClass}>Yayınlarınız</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {events.length === 0
                      ? "Henüz etkinlik yok."
                      : `${events.length} etkinlik`}
                  </p>
                </div>
              </div>

              {events.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low/40 px-6 py-10 text-center">
                  <p className="font-medium text-on-surface">
                    Henüz yayınlanmış etkinlik yok
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Yukarıdaki formdan ilk etkinliğinizi oluşturun.
                  </p>
                </div>
              ) : (
                <ul className="mt-5 space-y-3">
                  {events.map((ev) => {
                    const when = formatEventDate(ev.startAt);
                    const isDraft = ev.status === "DRAFT";
                    return (
                      <li
                        key={ev.id}
                        className="rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-4 transition-colors hover:border-outline-variant/50"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-on-surface">
                                {ev.title?.trim() || "İsimsiz etkinlik"}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                  isDraft
                                    ? "border border-secondary/40 bg-secondary/15 text-secondary"
                                    : "border border-primary/30 bg-primary/15 text-primary"
                                }`}
                              >
                                {isDraft ? "Taslak" : "Yayında"}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-on-surface-variant">
                              {ev.address}
                            </p>
                            {when ? (
                              <p className="mt-1 text-xs text-on-surface-variant/80">
                                {when}
                                {ev.price != null ? ` · ${ev.price} ₺` : ""}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(ev)}
                              className="rounded-full border border-outline-variant/50 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              Düzenle
                            </button>
                            <Link
                              href={`/events/${ev.id}`}
                              className="rounded-full border border-outline-variant/50 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              Görüntüle
                            </Link>
                            <button
                              type="button"
                              onClick={() => void removeEvent(ev.id)}
                              className="rounded-full border border-error/30 px-3 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error-container/20"
                            >
                              Sil
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
