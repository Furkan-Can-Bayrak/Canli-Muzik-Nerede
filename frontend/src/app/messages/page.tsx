"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

type ConversationRow = {
  id: string;
  lastMessageAt: string;
  cafeUser: {
    id: string;
    email: string;
    cafeProfile: { name: string } | null;
  };
  bandUser: {
    id: string;
    email: string;
    bandProfile: { bandName: string } | null;
  };
};

export default function MessagesIndexPage() {
  const router = useRouter();
  const { ready, token, user } = useAuth();
  const [list, setList] = useState<ConversationRow[]>([]);
  const [otherId, setOtherId] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch("/conversations", { token });
    if (!res.ok) return;
    setList((await res.json()) as ConversationRow[]);
  }, [token]);

  useEffect(() => {
    if (!ready) return;
    if (!token || (user?.role !== "CAFE" && user?.role !== "BAND")) {
      router.replace("/login?next=/messages");
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [ready, token, user?.role, router, load]);

  function partnerLabel(c: ConversationRow): string {
    if (user?.role === "CAFE") {
      return c.bandUser.bandProfile?.bandName ?? "Grup";
    }
    return c.cafeUser.cafeProfile?.name ?? "İşletme";
  }

  async function startConversation(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const trimmed = otherId.trim();
    if (!trimmed || !token) return;
    const res = await apiFetch("/conversations", {
      method: "POST",
      token,
      body: JSON.stringify({ otherUserId: trimmed }),
    });
    if (!res.ok) {
      setErr(
        "Sohbet başlatılamadı. Karşı tarafın kullanıcı UUID olduğundan ve rollerin kafe↔grup olduğundan emin olun.",
      );
      return;
    }
    const conv = (await res.json()) as { id: string };
    setOtherId("");
    router.push(`/messages/${conv.id}`);
  }

  if (!ready || !token || !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-zinc-500">
        Yönlendiriliyorsunuz…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Mesajlar
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Yalnızca işletme ve grup hesapları mesajlaşabilir. Gerçek zamanlı
          güncelleme sohbet ekranındadır.
        </p>
      </header>

      <Card className="p-4">
        <form onSubmit={startConversation} className="space-y-2">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Karşı kullanıcı UUID ile yeni sohbet
          </label>
          <input
            value={otherId}
            onChange={(e) => setOtherId(e.target.value)}
            placeholder={user.role === "CAFE" ? "Grup kullanıcı ID" : "İşletme kullanıcı ID"}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
          />
          {err ? (
            <p className="text-xs text-red-600 dark:text-red-400">{err}</p>
          ) : null}
          <Button type="submit" className="w-full sm:w-auto">
            Sohbet aç / bul
          </Button>
        </form>
      </Card>

      <ul className="space-y-2">
        {list.map((c) => (
          <li key={c.id}>
            <Link href={`/messages/${c.id}`}>
              <Card className="p-4 transition hover:ring-2 hover:ring-[var(--accent)]">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {partnerLabel(c)}
                </p>
                <p className="text-xs text-zinc-500">
                  {new Date(c.lastMessageAt).toLocaleString("tr-TR")}
                </p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      {list.length === 0 ? (
        <p className="text-sm text-zinc-500">Henüz sohbet yok.</p>
      ) : null}
    </div>
  );
}
