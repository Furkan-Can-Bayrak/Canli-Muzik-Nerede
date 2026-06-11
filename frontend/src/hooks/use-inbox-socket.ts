"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ConversationUpdatedEvent } from "@/lib/messages-types";
import { getSocketOrigin } from "@/lib/socket-url";

export function useInboxSocket(
  token: string | null,
  enabled: boolean,
  onUpdate: (event: ConversationUpdatedEvent) => void,
  onUnreadCountChanged?: () => void,
) {
  const handlerRef = useRef(onUpdate);
  const unreadRef = useRef(onUnreadCountChanged);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    handlerRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    unreadRef.current = onUnreadCountChanged;
  }, [onUnreadCountChanged]);

  useEffect(() => {
    if (!token || !enabled) {
      setConnected(false);
      return;
    }
    const origin = getSocketOrigin();
    if (!origin) return;

    const socket: Socket = io(origin, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    const onConversationUpdated = (payload: ConversationUpdatedEvent) => {
      handlerRef.current(payload);
    };

    const onUnreadChanged = () => {
      unreadRef.current?.();
    };

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinInbox");
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("conversationUpdated", onConversationUpdated);
    socket.on("unreadCountChanged", onUnreadChanged);

    return () => {
      socket.off("conversationUpdated", onConversationUpdated);
      socket.off("unreadCountChanged", onUnreadChanged);
      socket.disconnect();
      setConnected(false);
    };
  }, [token, enabled]);

  return { connected };
}
