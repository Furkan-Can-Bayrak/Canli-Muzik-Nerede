"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getSocketOrigin } from "@/lib/socket-url";

export function useConversationSocket(
  token: string | null,
  conversationId: string | null,
  onMessage: (msg: unknown) => void,
) {
  const handlerRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!token || !conversationId) {
      setConnected(false);
      setError(null);
      return;
    }
    const origin = getSocketOrigin();
    if (!origin) {
      setError("Socket adresi tanımlı değil.");
      return;
    }

    const socket: Socket = io(origin, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    const onCreated = (payload: unknown) => {
      handlerRef.current(payload);
    };

    socket.on("connect", () => {
      setConnected(true);
      setError(null);
      socket.emit("joinConversation", { conversationId });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => {
      setConnected(false);
      setError("Canlı bağlantı kurulamadı.");
    });
    socket.on("messageCreated", onCreated);

    return () => {
      socket.emit("leaveConversation", { conversationId });
      socket.off("messageCreated", onCreated);
      socket.disconnect();
      setConnected(false);
    };
  }, [token, conversationId]);

  return { connected, error };
}
