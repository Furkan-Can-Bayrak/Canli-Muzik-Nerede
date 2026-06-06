"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";

export default function AccountPage() {
  const router = useRouter();
  const { ready, token, user, logout } = useAuth();
  const [profile, setProfile] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/login?next=/account");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/auth/me", { token });
        if (!res.ok) {
          if (res.status === 401) {
            logout();
            router.replace("/login?next=/account");
            return;
          }
          throw new Error("Profil alınamadı.");
        }
        const data = await res.json();
        if (!cancelled) setProfile(data);
      } catch {
        if (!cancelled) setError("Profil yüklenirken hata oluştu.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token, logout, router]);

  if (!ready || !token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-zinc-500">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Hesabım
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Oturum:{" "}
        <span className="font-medium text-zinc-800 dark:text-zinc-200">
          {user?.email}
        </span>{" "}
        ({user?.role})
      </p>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : profile ? (
          <pre className="max-h-[480px] overflow-auto text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
            {JSON.stringify(profile, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-zinc-500">Profil yükleniyor…</p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {user?.role === "CAFE" ? (
          <Link
            href="/panel/cafe"
            className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            İşletme paneli
          </Link>
        ) : null}
        {user?.role === "BAND" ? (
          <Link
            href="/panel/band"
            className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Grup paneli
          </Link>
        ) : null}
        <Link
          href="/"
          className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
        >
          Etkinliklere dön
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace("/");
            router.refresh();
          }}
          className="text-sm font-medium text-red-700 underline dark:text-red-400"
        >
          Çıkış yap
        </button>
      </div>

      <p className="mt-8 text-xs text-zinc-500">
        Ziyaretçiler etkinlikleri ana sayfadan arayabilir. İşletme hesabıyla
        profil ve yayınları panelden yönetebilirsiniz; grup hesabıyla profil ve
        işletme sohbetleri paneldedir.
      </p>
    </div>
  );
}
