"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";
import { formatApiError } from "@/lib/errors";

const STORAGE_KEY = "canli_muzik_auth";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
};

type StoredAuth = {
  accessToken: string;
  user: AuthUser;
};

type AuthContextValue = {
  ready: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  registerCustomer: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<AuthUser>;
  registerCafe: (payload: {
    email: string;
    password: string;
    name: string;
    provinceId: string;
    districtId?: string;
    address: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    description?: string;
  }) => Promise<AuthUser>;
  registerBand: (payload: {
    email: string;
    password: string;
    bandName: string;
    memberCount: number;
    phone: string;
    basePrice: number;
    description?: string;
    provinceIds?: string[];
    districtIds?: string[];
    genreIds: string[];
  }) => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return formatApiError(body);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw) as StoredAuth;
          if (data?.accessToken && data?.user?.id) {
            const res = await apiFetch("/auth/me", { token: data.accessToken });
            if (res.ok) {
              const me = (await res.json()) as AuthUser;
              if (!cancelled) {
                setToken(data.accessToken);
                setUser(me);
              }
            } else if (!cancelled) {
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((data: StoredAuth) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(await readError(res));
      const body = (await res.json()) as StoredAuth;
      persist(body);
      return body.user;
    },
    [persist],
  );

  const registerCustomer = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const res = await apiFetch("/auth/register/customer", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          ...(displayName?.trim() ? { displayName: displayName.trim() } : {}),
        }),
      });
      if (!res.ok) throw new Error(await readError(res));
      const body = (await res.json()) as StoredAuth;
      persist(body);
      return body.user;
    },
    [persist],
  );

  const registerCafe = useCallback(
    async (payload: {
      email: string;
      password: string;
      name: string;
      provinceId: string;
      districtId?: string;
      address: string;
      latitude?: number;
      longitude?: number;
      phone?: string;
      description?: string;
    }) => {
      const res = await apiFetch("/auth/register/cafe", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readError(res));
      const body = (await res.json()) as StoredAuth;
      persist(body);
      return body.user;
    },
    [persist],
  );

  const registerBand = useCallback(
    async (payload: {
      email: string;
      password: string;
      bandName: string;
      memberCount: number;
      phone: string;
      basePrice: number;
      description?: string;
      provinceIds?: string[];
      districtIds?: string[];
      genreIds: string[];
    }) => {
      const res = await apiFetch("/auth/register/band", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readError(res));
      const body = (await res.json()) as StoredAuth;
      persist(body);
      return body.user;
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      ready,
      token,
      user,
      login,
      logout,
      registerCustomer,
      registerCafe,
      registerBand,
    }),
    [
      ready,
      token,
      user,
      login,
      logout,
      registerCustomer,
      registerCafe,
      registerBand,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
