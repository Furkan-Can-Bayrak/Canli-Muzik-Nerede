export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderUserId?: string;
  sender: { id: string; role: string };
};

export type ConversationRow = {
  id: string;
  lastMessageAt: string;
  lastPreview?: string;
  unreadCount?: number;
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

export type ConversationUpdatedEvent = {
  conversationId: string;
  lastMessageAt: string;
  preview: string;
  senderId: string;
};

export type ConversationDetail = ConversationRow;

export function sortConversations(
  conversations: ConversationRow[],
): ConversationRow[] {
  return [...conversations].sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );
}

export function partnerLabel(
  c: ConversationRow,
  viewerRole: string | undefined,
): string {
  if (viewerRole === "CAFE") {
    return c.bandUser.bandProfile?.bandName ?? "Grup";
  }
  return c.cafeUser.cafeProfile?.name ?? "İşletme";
}

export function sortChatMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

/** Tekilleştirilmiş ekleme; socket REST'ten önce gelirse pending optimistiği temizler. */
export function upsertChatMessage(
  prev: ChatMessage[],
  msg: ChatMessage,
): ChatMessage[] {
  if (prev.some((p) => p.id === msg.id)) return prev;
  const withoutPending = prev.filter(
    (p) =>
      !(
        p.id.startsWith("pending-") &&
        p.sender.id === msg.sender.id &&
        p.body === msg.body
      ),
  );
  return sortChatMessages([...withoutPending, msg]);
}

/** REST yanıtı geldiğinde optimistik mesajı gerçek kayıtla değiştirir. */
export function replaceOptimisticChatMessage(
  prev: ChatMessage[],
  optimisticId: string,
  msg: ChatMessage,
): ChatMessage[] {
  const next = prev.filter((m) => m.id !== optimisticId);
  if (next.some((m) => m.id === msg.id)) return next;
  return sortChatMessages([...next, msg]);
}

export function formatMessageTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (sameDay) {
      return d.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
