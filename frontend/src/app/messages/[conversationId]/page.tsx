"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatThread } from "@/components/messages/ChatThread";
import { useAuth } from "@/contexts/auth-context";
import { useConversationSocket } from "@/hooks/use-conversation-socket";
import { apiFetch } from "@/lib/api";
import {
  canUseMessages,
  defaultPathForRole,
  resolvePostLoginPath,
} from "@/lib/auth-routes";
import { formatApiError, formatFetchError } from "@/lib/errors";
import { dispatchMessagesUnreadRefresh } from "@/lib/messages-events";
import type { ChatMessage, ConversationDetail } from "@/lib/messages-types";
import {
  partnerLabel,
  replaceOptimisticChatMessage,
  sortChatMessages,
  upsertChatMessage,
} from "@/lib/messages-types";

async function readApiError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return formatApiError(body);
}

function messageSenderId(msg: ChatMessage): string | undefined {
  return msg.sender?.id ?? msg.senderUserId;
}

export default function ConversationPage() {
  const params = useParams();
  const conversationId =
    typeof params.conversationId === "string" ? params.conversationId : "";
  const router = useRouter();
  const { ready, token, user, logout } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<ConversationDetail | null>(
    null,
  );
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const authChecked = useRef(false);

  const canView =
    ready &&
    Boolean(token) &&
    Boolean(user) &&
    canUseMessages(user?.role) &&
    Boolean(conversationId);

  const handleUnauthorized = useCallback(() => {
    logout();
    router.replace(`/login?next=/messages/${conversationId}`);
  }, [logout, router, conversationId]);

  const handleUnauthorizedRef = useRef(handleUnauthorized);
  const markReadRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    handleUnauthorizedRef.current = handleUnauthorized;
  }, [handleUnauthorized]);

  useEffect(() => {
    markReadRef.current = () => {
      if (!token || !conversationId) return;
      void apiFetch(`/conversations/${conversationId}/read`, {
        method: "POST",
        token,
      }).then((res) => {
        if (res.ok) dispatchMessagesUnreadRefresh();
      });
    };
  }, [token, conversationId]);

  const mergeIncoming = useCallback(
    (payload: unknown) => {
      const msg = payload as ChatMessage;
      if (!msg?.id) return;
      setMessages((prev) => upsertChatMessage(prev, msg));
      const senderId = messageSenderId(msg);
      if (token && senderId && senderId !== user?.id) {
        markReadRef.current();
      }
    },
    [token, user?.id],
  );

  const { connected, error: socketError } = useConversationSocket(
    token,
    canView ? conversationId : null,
    mergeIncoming,
  );

  useEffect(() => {
    authChecked.current = false;
  }, [conversationId]);

  useEffect(() => {
    if (!ready || !conversationId || authChecked.current) return;
    authChecked.current = true;

    if (!token || !user) {
      router.replace(`/login?next=/messages/${conversationId}`);
      return;
    }
    if (!canUseMessages(user.role)) {
      router.replace(
        resolvePostLoginPath(user.role, `/messages/${conversationId}`),
      );
    }
  }, [ready, conversationId, token, user, router]);

  useEffect(() => {
    if (!canView) return;

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setErr(null);

      try {
        const msgRes = await apiFetch(
          `/conversations/${conversationId}/messages?take=80`,
          { token },
        );

        if (cancelled) return;

        if (msgRes.status === 401) {
          handleUnauthorizedRef.current();
          return;
        }

        if (!msgRes.ok) {
          setErr(await readApiError(msgRes));
          setMessages([]);
          return;
        }

        const raw = await msgRes.json();
        const list = Array.isArray(raw) ? (raw as ChatMessage[]) : [];
        setMessages(sortChatMessages(list));
        markReadRef.current();

        try {
          const convRes = await apiFetch(`/conversations/${conversationId}`, {
            token,
          });
          if (cancelled) return;

          if (convRes.ok) {
            setConversation((await convRes.json()) as ConversationDetail);
            return;
          }

          if (convRes.status === 404) {
            const listRes = await apiFetch("/conversations", { token });
            if (!cancelled && listRes.ok) {
              const rows = (await listRes.json()) as ConversationDetail[];
              const found = rows.find((c) => c.id === conversationId);
              if (found) setConversation(found);
            }
          }
        } catch {
          /* partner adı yüklenemese de mesajlar görünür */
        }
      } catch (e) {
        if (!cancelled) setErr(formatFetchError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canView, conversationId, token]);

  const partnerName = conversation
    ? partnerLabel(conversation, user?.role)
    : "Sohbet";

  async function send() {
    const text = draft.trim();
    if (!text || !token || !conversationId || sending || !user) return;
    setSending(true);
    setErr(null);
    const optimisticId = `pending-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
      body: text,
      createdAt: new Date().toISOString(),
      sender: { id: user.id, role: user.role },
    };
    setDraft("");
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await apiFetch(`/conversations/${conversationId}/messages`, {
        method: "POST",
        token,
        body: JSON.stringify({ body: text }),
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        throw new Error(await readApiError(res));
      }
      const msg = (await res.json()) as ChatMessage;
      setMessages((prev) =>
        replaceOptimisticChatMessage(prev, optimisticId, msg),
      );
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setDraft(text);
      setErr(e instanceof Error ? e.message : "Mesaj gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-2xl px-margin-mobile py-16 text-center text-sm text-on-surface-variant md:px-margin-desktop">
        Yükleniyor…
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="mx-auto max-w-2xl px-margin-mobile py-16 text-center text-sm text-on-surface-variant md:px-margin-desktop">
        Giriş sayfasına yönlendiriliyorsunuz…
      </div>
    );
  }

  if (!canUseMessages(user.role)) {
    return (
      <div className="mx-auto max-w-2xl px-margin-mobile py-16 text-center text-sm text-on-surface-variant md:px-margin-desktop">
        {defaultPathForRole(user.role)} sayfasına yönlendiriliyorsunuz…
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="mx-auto max-w-2xl px-margin-mobile py-16 text-center text-sm text-on-surface-variant md:px-margin-desktop">
        Geçersiz sohbet.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] flex-col overflow-hidden px-margin-mobile py-6 md:px-margin-desktop">
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden">
        <header className="mb-4 flex shrink-0 flex-col gap-3 border-b border-outline-variant/25 pb-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link
              href="/messages"
              className="shrink-0 rounded-full border border-outline-variant/50 px-3 py-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
            >
              ← Mesajlar
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-lg font-semibold text-on-surface md:text-xl">
                {partnerName}
              </h1>
            </div>
          </div>
          {user.role === "CAFE" && conversation ? (
            <Link
              href={`/panel/cafe?bandId=${encodeURIComponent(conversation.bandUser.id)}`}
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary transition-transform hover:scale-[0.98]"
            >
              Etkinlik ayarla
            </Link>
          ) : null}
        </header>

        {err ? (
          <p className="mb-3 shrink-0 rounded-xl border border-error/30 bg-error-container/20 px-4 py-2 text-sm text-error">
            {err}
          </p>
        ) : null}

        {loading ? (
          <div className="glass-card flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-outline-variant/35 p-8">
            <p className="text-sm text-on-surface-variant">Yükleniyor…</p>
          </div>
        ) : (
          <ChatThread
            messages={messages}
            currentUserId={user.id}
            partnerName={partnerName}
            draft={draft}
            onDraftChange={setDraft}
            onSend={() => void send()}
            sending={sending}
            connected={connected}
            error={socketError}
          />
        )}
      </div>
    </div>
  );
}
