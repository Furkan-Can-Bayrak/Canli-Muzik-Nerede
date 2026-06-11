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

export function formatFetchError(error: unknown): string {
  if (error instanceof TypeError || error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("failed to fetch") ||
      msg.includes("networkerror") ||
      msg.includes("load failed")
    ) {
      return "Sunucuya bağlanılamadı. Backend'in çalıştığından emin olun.";
    }
    if (error.message === "NEXT_PUBLIC_API_URL is not set") {
      return "API adresi tanımlı değil (NEXT_PUBLIC_API_URL).";
    }
    return error.message;
  }
  return "Liste alınamadı.";
}
