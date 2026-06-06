"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useConversationSocket } from "@/hooks/use-conversation-socket";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; role: string };
};

export default function ConversationPage() {
  const params = useParams();
  const conversationId =
    typeof params.conversationId === "string" ? params.conversationId : "";
  const router = useRouter();
  const { ready, token, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const mergeIncoming = useCallback((payload: unknown) => {
    const msg = payload as ChatMessage;
    if (!msg?.id) return;
    setMessages((prev) => {
      if (prev.some((p) => p.id === msg.id)) return prev;
      return [...prev, msg].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });
  }, []);

  useConversationSocket(token, conversationId || null, mergeIncoming);

  const loadMessages = useCallback(async () => {
    if (!token || !conversationId) return;
    const res = await apiFetch(
      `/conversations/${conversationId}/messages?take=80`,
      { token },
    );
    if (!res.ok) {
      setErr("Mesajlar yüklenemedi veya erişim yok.");
      return;
    }
    const list = (await res.json()) as ChatMessage[];
    setMessages(
      [...list].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    );
    setErr(null);
  }, [token, conversationId]);

  useEffect(() => {
    if (!ready) return;
    if (!token || (user?.role !== "CAFE" && user?.role !== "BAND")) {
      router.replace("/login?next=/messages");
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void loadMessages();
    });
    return () => {
      cancelled = true;
    };
  }, [ready, token, user?.role, router, loadMessages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !token || !conversationId) return;
    const res = await apiFetch(`/conversations/${conversationId}/messages`, {
      method: "POST",
      token,
      body: JSON.stringify({ body: text }),
    });
    if (!res.ok) {
      setErr("Gönderilemedi.");
      return;
    }
    setDraft("");
    const msg = (await res.json()) as ChatMessage;
    mergeIncoming(msg);
  }

  if (!ready || !token || !user || !conversationId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-zinc-500">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/messages"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          ← Liste
        </Link>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Sohbet
        </h1>
      </div>

      {err ? (
        <p className="mb-2 text-sm text-red-600 dark:text-red-400">{err}</p>
      ) : null}

      <Card className="mb-4 flex max-h-[55vh] flex-col overflow-hidden">
        <ul className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          {messages.map((m) => {
            const mine = m.sender.id === user.id;
            return (
              <li
                key={m.id}
                className={`flex flex-col rounded-lg px-3 py-2 ${
                  mine
                    ? "ml-8 bg-[var(--accent)]/15 text-zinc-900 dark:text-zinc-100"
                    : "mr-8 bg-zinc-100 dark:bg-zinc-800/80"
                }`}
              >
                <span className="text-[10px] uppercase text-zinc-500">
                  {m.sender.role} ·{" "}
                  {new Date(m.createdAt).toLocaleString("tr-TR")}
                </span>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
              </li>
            );
          })}
        </ul>
      </Card>

      <form onSubmit={send} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Mesaj yazın"
          className="min-h-11 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Button type="submit" disabled={!draft.trim()}>
          Gönder
        </Button>
      </form>
    </div>
  );
}
