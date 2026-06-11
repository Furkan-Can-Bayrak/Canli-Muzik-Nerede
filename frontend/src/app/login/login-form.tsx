"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { navigateAfterAuth } from "@/lib/auth-routes";

const DEV_LOGIN_PASSWORD = "123456";

type DevLoginHint = { email: string; role: string };

function DevAccountColumn({
  title,
  hints,
  onSelect,
}: {
  title: string;
  hints: DevLoginHint[];
  onSelect: (email: string) => void;
}) {
  return (
    <div className="glass-card flex min-h-0 flex-col rounded-2xl border border-outline-variant/35 p-4 shadow-xl md:p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-secondary/90">
        {title}
      </h2>
      {hints.length === 0 ? (
        <p className="mt-3 text-sm text-on-surface-variant">Hesap yok.</p>
      ) : (
        <ul className="mt-3 max-h-[min(320px,45vh)] space-y-1 overflow-y-auto">
          {hints.map((hint) => (
            <li key={hint.email}>
              <button
                type="button"
                onClick={() => onSelect(hint.email)}
                className="w-full cursor-pointer rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-primary/10"
              >
                <span className="block truncate text-sm font-medium text-on-surface">
                  {hint.email}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const labelClass = "block text-sm font-medium text-on-surface-variant";
const inputClass =
  "mt-1.5 w-full rounded-xl border border-outline-variant/40 bg-surface-container/60 px-4 py-2.5 font-sans text-base text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, ready } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [devHints, setDevHints] = useState<DevLoginHint[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiFetch("/auth/dev-login-hints");
        if (!res.ok) return;
        const data = (await res.json()) as DevLoginHint[];
        if (!cancelled) setDevHints(data);
      } catch {
        /* production veya endpoint yok */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const nextPath = searchParams.get("next") || "/";
  const redirectedRef = useRef(false);
  const redirecting = ready && Boolean(user);

  useEffect(() => {
    if (!user) {
      redirectedRef.current = false;
      return;
    }
    if (!ready || redirectedRef.current) return;
    redirectedRef.current = true;
    navigateAfterAuth(router, user.role, nextPath);
  }, [ready, user, nextPath, router]);

  if (redirecting) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-on-surface-variant">
        Yönlendiriliyorsunuz…
      </div>
    );
  }

  const bandHints = devHints.filter((h) => h.role === "BAND");
  const customerHints = devHints.filter((h) => h.role === "CUSTOMER");
  const cafeHints = devHints.filter((h) => h.role === "CAFE");

  function selectDevAccount(accountEmail: string) {
    setEmail(accountEmail);
    setPassword(DEV_LOGIN_PASSWORD);
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const loggedInUser = await login(email, password);
      navigateAfterAuth(router, loggedInUser.role, nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-10rem)] overflow-hidden px-margin-mobile py-10 md:px-margin-desktop md:py-14">
      <div
        className="pointer-events-none absolute -left-20 top-16 size-72 rounded-full bg-primary/10 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-10 size-72 rounded-full bg-secondary/10 blur-[100px]"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
            Giriş yap
          </h1>
          <p className="mt-3 text-base text-on-surface-variant">
            Hesabınız yok mu?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary underline-offset-4 transition-colors hover:underline"
            >
              Kayıt olun
            </Link>
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <div className="glass-card rounded-2xl border border-outline-variant/35 p-6 shadow-2xl md:p-8">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-5 rounded-xl border border-outline-variant/25 bg-surface-container-low/30 p-4 md:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary/90">
                  Giriş bilgileri
                </p>
                <div>
                  <label htmlFor="email" className={labelClass}>
                    E-posta
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="password" className={labelClass}>
                    Şifre
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {error ? (
                <p className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending || !ready}
                className="w-full cursor-pointer rounded-full bg-primary py-3.5 text-base font-bold text-on-primary transition-transform hover:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Giriş yapılıyor…" : "Giriş yap"}
              </button>
            </form>
          </div>
        </div>

        {devHints.length > 0 ? (
          <section className="mt-10">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-secondary/90">
              Test hesapları
            </p>
            <p className="mt-1 text-center text-xs text-on-surface-variant">
              Tıklayınca e-posta ve şifre ({DEV_LOGIN_PASSWORD}) dolar.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <DevAccountColumn
                title="Gruplar"
                hints={bandHints}
                onSelect={selectDevAccount}
              />
              <DevAccountColumn
                title="Müşteriler"
                hints={customerHints}
                onSelect={selectDevAccount}
              />
              <DevAccountColumn
                title="İşletmeler"
                hints={cafeHints}
                onSelect={selectDevAccount}
              />
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
