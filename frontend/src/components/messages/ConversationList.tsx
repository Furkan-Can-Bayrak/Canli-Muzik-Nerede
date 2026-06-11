import Link from "next/link";
import type { ConversationRow } from "@/lib/messages-types";
import { formatMessageTime, partnerLabel } from "@/lib/messages-types";

type Props = {
  conversations: ConversationRow[];
  viewerRole: string | undefined;
  inboxConnected: boolean;
};

export function ConversationList({
  conversations,
  viewerRole,
  inboxConnected,
}: Props) {
  if (conversations.length === 0) {
    return (
      <div className="glass-card rounded-2xl border border-dashed border-outline-variant/40 px-6 py-14 text-center">
        <p className="font-display text-lg font-semibold text-on-surface">
          Henüz sohbet yok
        </p>
        <p className="mt-2 text-sm text-on-surface-variant">
          Bir grupla iletişime geçmek için{" "}
          <Link href="/bands" className="font-medium text-primary hover:underline">
            gruplar
          </Link>{" "}
          sayfasından mesaj başlatabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2 px-1">
        <span
          className={`inline-flex items-center gap-1.5 text-xs ${
            inboxConnected ? "text-secondary" : "text-on-surface-variant"
          }`}
        >
          <span
            className={`size-2 rounded-full ${
              inboxConnected ? "bg-secondary" : "bg-outline-variant"
            }`}
            aria-hidden
          />
          {inboxConnected ? "Canlı güncelleme açık" : "Bağlanıyor…"}
        </span>
      </div>
      <ul className="space-y-2">
        {conversations.map((c) => {
          const name = partnerLabel(c, viewerRole);
          const unread = (c.unreadCount ?? 0) > 0;
          return (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                className={`glass-card block rounded-2xl border p-4 transition-all hover:border-primary/40 ${
                  unread
                    ? "border-primary/35 bg-primary/5"
                    : "border-outline-variant/35"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {unread ? (
                        <span
                          className="relative flex h-2 w-2 shrink-0"
                          aria-hidden
                        >
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                        </span>
                      ) : null}
                      <p
                        className={`truncate font-display text-base text-on-surface ${
                          unread ? "font-bold" : "font-semibold"
                        }`}
                      >
                        {name}
                      </p>
                      {unread ? (
                        <span className="inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-on-primary">
                          {(c.unreadCount ?? 0) > 99
                            ? "99+"
                            : c.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    {c.lastPreview ? (
                      <p
                        className={`mt-1 truncate text-sm ${
                          unread
                            ? "font-medium text-on-surface"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {c.lastPreview}
                      </p>
                    ) : null}
                  </div>
                  <time
                    className={`shrink-0 text-xs ${
                      unread
                        ? "font-semibold text-primary"
                        : "text-on-surface-variant"
                    }`}
                    dateTime={c.lastMessageAt}
                  >
                    {formatMessageTime(c.lastMessageAt)}
                  </time>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
