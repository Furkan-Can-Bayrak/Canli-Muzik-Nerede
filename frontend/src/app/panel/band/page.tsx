"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";

import {
  BandAreaPicker,
  bandAreaFromApi,
  emptyBandArea,
  type BandAreaValue,
} from "@/components/location/BandAreaPicker";
import type { Province } from "@/lib/location-types";

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
};

type DraftEvent = {
  id: string;
  title: string | null;
  status: string;
  startAt: string | null;
  cafe: { name: string };
};

export default function BandPanelPage() {
  const router = useRouter();
  const { ready, token, user, logout } = useAuth();
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
          apiFetch("/genres"),
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

  function toggleId(list: string[], id: string, set: (v: string[]) => void) {
    if (list.includes(id)) set(list.filter((x) => x !== id));
    else set([...list, id]);
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
    setMsg("Profil güncellendi.");
  }

  if (!ready || !token || user?.role !== "BAND") {
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
            Grup paneli
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Kullanıcı ID:{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
              {user.id}
            </code>
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-zinc-600 underline dark:text-zinc-400">
            Ana sayfa
          </Link>
          <Link href="/messages" className="text-zinc-600 underline dark:text-zinc-400">
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
              Grup profili
            </h2>
            <form onSubmit={saveProfile} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Grup adı
                </label>
                <input
                  required
                  value={bandName}
                  onChange={(e) => setBandName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Üye sayısı
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={memberCount}
                    onChange={(e) => setMemberCount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Taban fiyat (₺)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Telefon (işletmelerle paylaşım için)
                </label>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Açıklama
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <BandAreaPicker
                provinces={provinces}
                value={bandArea}
                onChange={setBandArea}
              />
              <div>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Türler (çoklu)
                </span>
                <div className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-auto rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                  {genres.map((g) => (
                    <label key={g.id} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={genreIds.includes(g.id)}
                        onChange={() => toggleId(genreIds, g.id, setGenreIds)}
                      />
                      {g.name}
                    </label>
                  ))}
                </div>
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
              İşletmelerle mesajlaşma
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Sohbetleri tek ekranda yönetmek için mesajlar sayfasına gidin.
            </p>
            <Link
              href="/messages"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Mesajlara git
            </Link>
          </section>

          <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
              Onay bekleyen etkinlikler (taslak)
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              İşletme sizi etkinliğe eklediğinde kayıt taslak olarak oluşur.
              Yayına aldığınızda müşteriler keşif listesinde görür.
            </p>
            {draftEvents.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">Şu an taslak yok.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {draftEvents.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-3 text-sm dark:border-zinc-800"
                  >
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {d.title?.trim() || "İsimsiz etkinlik"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {d.cafe.name}
                        {d.startAt
                          ? ` · ${new Date(d.startAt).toLocaleString("tr-TR")}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/events/${d.id}`}
                        className="inline-flex min-h-11 items-center rounded-lg border border-zinc-300 px-3 py-2 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
                      >
                        Önizle
                      </Link>
                      <button
                        type="button"
                        onClick={() => void publishDraft(d.id)}
                        className="inline-flex min-h-11 items-center rounded-lg bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      >
                        Yayınla
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
