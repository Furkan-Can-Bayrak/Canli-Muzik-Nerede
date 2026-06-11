import type { ChatMessage } from "@/lib/messages-types";
import { formatMessageTime } from "@/lib/messages-types";

type Props = {
  message: ChatMessage;
  mine: boolean;
  partnerName: string;
};

export function MessageBubble({ message, mine, partnerName }: Props) {
  return (
    <li className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          mine
            ? "rounded-br-md bg-primary text-on-primary"
            : "rounded-bl-md border border-outline-variant/30 bg-surface-container-high text-on-surface"
        }`}
      >
        <p
          className={`mb-1 text-[10px] font-medium uppercase tracking-wide ${
            mine ? "text-on-primary/70" : "text-on-surface-variant"
          }`}
        >
          {mine ? "Siz" : partnerName} · {formatMessageTime(message.createdAt)}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.body}
        </p>
      </div>
    </li>
  );
}
