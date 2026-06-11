"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConversationList } from "@/components/messages/ConversationList";
import { useAuth } from "@/contexts/auth-context";
import { useInboxSocket } from "@/hooks/use-inbox-socket";
import { apiFetch } from "@/lib/api";
import {
  canUseMessages,
  defaultPathForRole,
  resolvePostLoginPath,
} from "@/lib/auth-routes";
import type {
  ConversationRow,
  ConversationUpdatedEvent,
} from "@/lib/messages-types";
import { sortConversations } from "@/lib/messages-types";

function applyInboxUpdate(
  list: ConversationRow[],
  event: ConversationUpdatedEvent,
  viewerUserId?: string,
): ConversationRow[] {
  const idx = list.findIndex((c) => c.id === event.conversationId);
  if (idx === -1) return list;
  const existing = list[idx]!;
  const fromOther = Boolean(viewerUserId && event.senderId !== viewerUserId);
  const updated: ConversationRow = {
    ...existing,
    lastMessageAt:
      typeof event.lastMessageAt === "string"
        ? event.lastMessageAt
        : new Date(event.lastMessageAt).toISOString(),
    lastPreview: event.preview,
    unreadCount: fromOther
      ? (existing.unreadCount ?? 0) + 1
      : existing.unreadCount,
  };
  const rest = list.filter((_, i) => i !== idx);
  return sortConversations([updated, ...rest]);
}

export default function MessagesIndexPage() {
  const router = useRouter();
  const { ready, token, user, logout } = useAuth();
  const [list, setList] = useState<ConversationRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const authChecked = useRef(false);

  const canView =
    ready && Boolean(token) && Boolean(user) && canUseMessages(user?.role);

  const load = useCallback(async () => {
    if (!token || !canUseMessages(user?.role)) return;
    setLoading(true);
    try {
      const res = await apiFetch("/conversations", { token });
      if (res.status === 401) {
        logout();
        router.replace("/login?next=/messages");
        return;
      }
      if (!res.ok) throw new Error();
      const rows = (await res.json()) as ConversationRow[];
      setList(sortConversations(rows));
      setErr(null);
    } catch {
      setErr("Sohbetler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [token, user?.role, router, logout]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  const onInboxUpdate = useCallback(
    (event: ConversationUpdatedEvent) => {
      setList((prev) => applyInboxUpdate(prev, event, user?.id));
    },
    [user?.id],
  );

  const onUnreadCountChanged = useCallback(() => {
    void loadRef.current();
  }, []);

  const { connected: inboxConnected } = useInboxSocket(
    token,
    canView,
    onInboxUpdate,
    onUnreadCountChanged,
  );

  useEffect(() => {
    if (!ready || authChecked.current) return;
    authChecked.current = true;

    if (!token || !user) {
      router.replace("/login?next=/messages");
      return;
    }
    if (!canUseMessages(user.role)) {
      router.replace(resolvePostLoginPath(user.role, "/messages"));
    }
  }, [ready, token, user, router]);

  useEffect(() => {
    if (!canView) return;
    void load();
  }, [canView, load]);

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

  return (
    <div className="relative min-h-[calc(100vh-10rem)] overflow-hidden px-margin-mobile py-10 md:px-margin-desktop md:py-14">
      <div
        className="pointer-events-none absolute -left-20 top-16 size-72 rounded-full bg-primary/10 blur-[100px]"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-2xl space-y-8">
        <header>
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-secondary">
            İletişim
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
            Mesajlar
          </h1>
          <p className="mt-3 text-base text-on-surface-variant">
            İşletme ve grup hesapları arasında anlık mesajlaşma.
          </p>
        </header>

        {err ? (
          <p className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
            {err}
          </p>
        ) : null}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl border border-outline-variant/35 bg-surface-container-high"
              />
            ))}
          </div>
        ) : (
          <ConversationList
            conversations={list}
            viewerRole={user.role}
            inboxConnected={inboxConnected}
          />
        )}
      </div>
    </div>
  );
}
