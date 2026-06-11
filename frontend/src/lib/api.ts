export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base?.trim()) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return base.replace(/\/$/, "");
}

/** Tarayıcıda yerel API için same-origin proxy (/backend → Nest). */
function getRequestBaseUrl(): string {
  if (typeof window === "undefined") {
    return getApiBaseUrl();
  }
  try {
    const base = getApiBaseUrl();
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base)) {
      return "/backend";
    }
  } catch {
    /* fall through */
  }
  return getApiBaseUrl();
}

function joinUrl(path: string): string {
  const base = getRequestBaseUrl();
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

export type ApiUploadOptions = {
  token?: string | null;
  formData: FormData | (() => FormData);
};

export async function apiUpload(
  path: string,
  init: ApiUploadOptions,
): Promise<Response> {
  const { token, formData } = init;
  const h = new Headers();
  if (token) {
    h.set("Authorization", `Bearer ${token}`);
  }
  const body = typeof formData === "function" ? formData() : formData;
  return fetch(joinUrl(path), {
    method: "POST",
    headers: h,
    body,
    credentials: "include",
  });
}
