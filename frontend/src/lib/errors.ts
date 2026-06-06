export function formatApiError(body: unknown): string {
  if (!body || typeof body !== "object") return "İstek başarısız oldu.";
  const o = body as Record<string, unknown>;
  const msg = o.message;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg) && msg.every((x) => typeof x === "string")) {
    return msg.join(", ");
  }
  return "İstek başarısız oldu.";
}
