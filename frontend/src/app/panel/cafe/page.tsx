"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { BusinessAddressPicker } from "@/components/location/BusinessAddressPicker";
import { ProvinceDistrictSelect } from "@/components/location/ProvinceDistrictSelect";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
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
};

export default function CafePanelPage() {
  const router = useRouter();
  const { ready, token, user, logout } = useAuth();
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

  const [evTitle, setEvTitle] = useState("");
  const [evProvinceId, setEvProvinceId] = useState("");
  const [evDistrictId, setEvDistrictId] = useState("");
  const [evAddress, setEvAddress] = useState("");
  const [evDescription, setEvDescription] = useState("");
  const [evStart, setEvStart] = useState("");
  const [evPrice, setEvPrice] = useState("");
  const [evBandId, setEvBandId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

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

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
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
    setMsg("Profil güncellendi.");
  }

  function resetEventForm() {
    setEditingId(null);
    setEvTitle("");
    setEvAddress("");
    setEvDescription("");
    setEvStart("");
    setEvPrice("");
    setEvBandId("");
    setEvProvinceId(cafeLocation.provinceId);
    setEvDistrictId(cafeLocation.districtId ?? "");
  }

  function startEdit(ev: EventRow) {
    setEditingId(ev.id);
    setEvTitle(ev.title ?? "");
    setEvProvinceId(ev.provinceId);
    setEvDistrictId(ev.districtId ?? "");
    setEvAddress(ev.address);
    setEvDescription(ev.description ?? "");
    setEvStart(
      ev.startAt
        ? new Date(ev.startAt).toISOString().slice(0, 16)
        : "",
    );
    setEvPrice(ev.price != null ? String(ev.price) : "");
    setEvBandId(ev.bandId ?? "");
  }

  async function saveEvent(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    const priceRaw = evPrice.trim();
    const body: Record<string, unknown> = {
      provinceId: evProvinceId,
      districtId: evDistrictId || undefined,
      address: evAddress,
      title: evTitle || undefined,
      description: evDescription || undefined,
      startAt: evStart ? new Date(evStart).toISOString() : undefined,
      price:
        priceRaw === "" ? undefined : Number.parseInt(priceRaw, 10),
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
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-zinc-500">
        Yönlendiriliyorsunuz…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            İşletme paneli
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Kullanıcı ID (etkinlik / API):{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
              {user.id}
            </code>
           </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-zinc-600 underline dark:text-zinc-400">
            Ana sayfa
          </Link>
          <Link
            href="/messages"
            className="text-zinc-600 underline dark:text-zinc-400"
          >
            Mesajlar
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Yükleniyor…</p>
      ) : (
        <>
          {msg ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
              {msg}
            </p>
          ) : null}
          {err ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
              {err}
            </p>
          ) : null}

          <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
              Kafe profili
            </h2>
            <form onSubmit={saveProfile} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  İsim
                </label>
                <input
                  required
                  value={cafeName}
                  onChange={(e) => setCafeName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <BusinessAddressPicker
                provinces={provinces}
                value={cafeLocation}
                onChange={setCafeLocation}
              />
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Telefon (genelde yalnızca siz ve anlaştığınız gruplar görür)
                </label>
                <input
                  value={cafePhone}
                  onChange={(e) => setCafePhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Açıklama
                </label>
                <textarea
                  value={cafeDescription}
                  onChange={(e) => setCafeDescription(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Profili kaydet
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
              {editingId ? "Etkinliği düzenle" : "Yeni etkinlik"}
            </h2>
            <form onSubmit={saveEvent} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Başlık
                </label>
                <input
                  value={evTitle}
                  onChange={(e) => setEvTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <ProvinceDistrictSelect
                provinces={provinces}
                provinceId={evProvinceId}
                districtId={evDistrictId}
                onProvinceChange={setEvProvinceId}
                onDistrictChange={setEvDistrictId}
                provinceLabel="İl"
                districtLabel="İlçe"
                compact
              />
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Etkinlik adresi
                </label>
                <input
                  required
                  minLength={5}
                  value={evAddress}
                  onChange={(e) => setEvAddress(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Başlangıç
                </label>
                <input
                  type="datetime-local"
                  value={evStart}
                  onChange={(e) => setEvStart(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Liste fiyatı (₺, boş bırakılabilir)
                </label>
                <input
                  type="number"
                  min={0}
                  value={evPrice}
                  onChange={(e) => setEvPrice(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Grup (isteğe bağlı)
                </label>
                <select
                  value={evBandId}
                  onChange={(e) => setEvBandId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="">—</option>
                  {bands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bandName}
                      {b.phone ? ` · ${b.phone}` : ""}
                    </option>
                  ))}
                </select>
                {evBandId ? (
                  <p className="mt-2 text-xs text-amber-800 dark:text-amber-200/90">
                    Grup seçildiğinde etkinlik <strong>taslak</strong> olarak
                    kaydedilir; grup onayından sonra yayına geçer ve keşifte
                    görünür.
                  </p>
                ) : null}
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Açıklama
                </label>
                <textarea
                  value={evDescription}
                  onChange={(e) => setEvDescription(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
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
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
                  >
                    İptal
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section>
            <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
              Yayınlarınız
            </h2>
            <ul className="mt-3 space-y-2">
              {events.map((ev) => (
                <li
                  key={ev.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                >
                  <div>
                    <span className="font-medium">
                      {ev.title?.trim() || "İsimsiz"}
                    </span>
                    {ev.status === "DRAFT" ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                        Taslak
                      </span>
                    ) : (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200">
                        Yayında
                      </span>
                    )}
                    <span className="ml-2 text-zinc-500">{ev.address}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(ev)}
                      className="text-zinc-700 underline dark:text-zinc-300"
                    >
                      Düzenle
                    </button>
                    <Link
                      href={`/events/${ev.id}`}
                      className="text-zinc-700 underline dark:text-zinc-300"
                    >
                      Görüntüle
                    </Link>
                    <button
                      type="button"
                      onClick={() => void removeEvent(ev.id)}
                      className="text-red-600 underline dark:text-red-400"
                    >
                      Sil
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/");
            }}
            className="text-sm text-red-600 underline dark:text-red-400"
          >
            Çıkış
          </button>
        </>
      )}
    </div>
  );
}
