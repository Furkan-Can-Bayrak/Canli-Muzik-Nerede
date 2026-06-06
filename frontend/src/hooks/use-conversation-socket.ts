"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { getSocketOrigin } from "@/lib/socket-url";

export function useConversationSocket(
  token: string | null,
  conversationId: string | null,
  onMessage: (msg: unknown) => void,
) {
  const handlerRef = useRef(onMessage);

  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!token || !conversationId) return;
    const origin = getSocketOrigin();
    if (!origin) return;

    const socket: Socket = io(origin, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    const onCreated = (payload: unknown) => {
      handlerRef.current(payload);
    };

    socket.on("connect", () => {
      socket.emit("joinConversation", { conversationId });
    });
    socket.on("messageCreated", onCreated);

    return () => {
      socket.emit("leaveConversation", { conversationId });
      socket.off("messageCreated", onCreated);
      socket.disconnect();
    };
  }, [token, conversationId]);
}
