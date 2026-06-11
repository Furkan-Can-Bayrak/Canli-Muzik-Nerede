"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
} from "react";
import type { ChatMessage } from "@/lib/messages-types";
import { MessageBubble } from "@/components/messages/MessageBubble";

type Props = {
  messages: ChatMessage[];
  currentUserId: string;
  partnerName: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  connected: boolean;
  error: string | null;
};

export function ChatThread({
  messages,
  currentUserId,
  partnerName,
  draft,
  onDraftChange,
  onSend,
  sending,
  connected,
  error,
}: Props) {
  const listRef = useRef<HTMLUListElement>(null);
  const lastScrolledIdRef = useRef<string | null>(null);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.id === lastScrolledIdRef.current) return;
    lastScrolledIdRef.current = last.id;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSend();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-1">
        <span
          className={`inline-flex items-center gap-1.5 text-xs ${
            connected ? "text-secondary" : "text-on-surface-variant"
          }`}
        >
          <span
            className={`size-2 rounded-full ${
              connected ? "bg-secondary" : "bg-outline-variant"
            }`}
            aria-hidden
          />
          {connected ? "Canlı" : "Bağlanıyor…"}
        </span>
        {error ? <span className="text-xs text-error">{error}</span> : null}
      </div>

      <ul
        ref={listRef}
        className="glass-card mb-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-2xl border border-outline-variant/35 p-4"
      >
        {messages.length === 0 ? (
          <li className="py-8 text-center text-sm text-on-surface-variant">
            Henüz mesaj yok. İlk mesajı siz gönderin.
          </li>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              mine={(m.sender?.id ?? m.senderUserId) === currentUserId}
              partnerName={partnerName}
            />
          ))
        )}
      </ul>

      <form onSubmit={handleSubmit} className="flex shrink-0 gap-2">
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mesaj yazın…"
          rows={2}
          className="min-h-11 flex-1 resize-none rounded-xl border border-outline-variant/40 bg-surface-container/60 px-4 py-2.5 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="min-h-11 shrink-0 cursor-pointer rounded-full bg-primary px-5 text-sm font-bold text-on-primary transition-transform hover:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "…" : "Gönder"}
        </button>
      </form>
      <p className="mt-2 shrink-0 text-center text-[10px] text-on-surface-variant">
        Enter gönder · Shift+Enter yeni satır
      </p>
    </div>
  );
}
