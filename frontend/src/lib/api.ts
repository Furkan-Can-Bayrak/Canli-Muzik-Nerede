export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base?.trim()) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return base.replace(/\/$/, "");
}

function joinUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export type ApiFetchOptions = RequestInit & {
  token?: string | null;
};

export async function apiFetch(
  path: string,
  init: ApiFetchOptions = {},
): Promise<Response> {
  const { token, headers, ...rest } = init;
  const h = new Headers(headers);
  if (token) {
    h.set("Authorization", `Bearer ${token}`);
  }
  if (rest.body != null && !h.has("Content-Type")) {
    h.set("Content-Type", "application/json");
  }
  return fetch(joinUrl(path), {
    ...rest,
    headers: h,
    credentials: "include",
  });
}
