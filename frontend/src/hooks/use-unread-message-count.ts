"use client";

import { useCallback, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { apiFetch } from "@/lib/api";
import { MESSAGES_UNREAD_REFRESH } from "@/lib/messages-events";
import type { ConversationUpdatedEvent } from "@/lib/messages-types";
import { getSocketOrigin } from "@/lib/socket-url";

export function useUnreadMessageCount(
  token: string | null,
  userId: string | undefined,
  enabled: boolean,
  activeConversationId?: string | null,
) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!token || !enabled) return;
    try {
      const res = await apiFetch("/conversations/unread-count", { token });
      if (!res.ok) return;
      const body = (await res.json()) as { count?: number };
      setCount(typeof body.count === "number" ? body.count : 0);
    } catch {
      /* ignore */
    }
  }, [token, enabled]);

  useEffect(() => {
    if (!enabled || !token) {
      setCount(0);
      return;
    }
    void refresh();
  }, [enabled, token, refresh]);

  useEffect(() => {
    const onRefresh = () => void refresh();
    window.addEventListener(MESSAGES_UNREAD_REFRESH, onRefresh);
    return () => window.removeEventListener(MESSAGES_UNREAD_REFRESH, onRefresh);
  }, [refresh]);

  useEffect(() => {
    if (!token || !enabled || !userId) return;
    const origin = getSocketOrigin();
    if (!origin) return;

    const socket: Socket = io(origin, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    const onUnread = (payload: { count?: number }) => {
      if (typeof payload?.count === "number") setCount(payload.count);
    };

    const onConversationUpdated = (event: ConversationUpdatedEvent) => {
      if (event.senderId === userId) return;
      if (
        activeConversationId &&
        event.conversationId === activeConversationId
      ) {
        return;
      }
      void refresh();
    };

    socket.on("connect", () => socket.emit("joinInbox"));
    socket.on("unreadCountChanged", onUnread);
    socket.on("conversationUpdated", onConversationUpdated);

    return () => {
      socket.off("unreadCountChanged", onUnread);
      socket.off("conversationUpdated", onConversationUpdated);
      socket.disconnect();
    };
  }, [token, enabled, userId, refresh, activeConversationId]);

  return { count, refresh };
}
