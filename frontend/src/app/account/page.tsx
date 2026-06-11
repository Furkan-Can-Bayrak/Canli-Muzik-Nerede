"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DeleteAccountButton } from "@/components/account/DeleteAccountButton";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { defaultPathForRole, navigateAfterAuth } from "@/lib/auth-routes";

const roleLabels: Record<string, string> = {
  CUSTOMER: "Ziyaretçi",
  CAFE: "İşletme",
  BAND: "Grup",
};

type LocationRef = { id: string; name: string; plateCode?: string };

type UserProfile = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  customerProfile: { displayName: string | null } | null;
  cafeProfile: {
    name: string;
    address: string;
    phone: string | null;
    description: string | null;
    province?: LocationRef;
    district?: LocationRef | null;
  } | null;
  bandProfile: {
    bandName: string;
    memberCount: number;
    phone: string;
    basePrice: number;
    description: string | null;
  } | null;
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="border-b border-outline-variant/20 py-3 last:border-b-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
        {label}
      </dt>
      <dd className="mt-1 text-base text-on-surface">{value}</dd>
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="glass-card animate-pulse rounded-2xl border border-outline-variant/35 p-6 md:p-8">
      <div className="flex items-center gap-4">
        <div className="size-14 rounded-full bg-surface-container-high" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 rounded-lg bg-surface-container-high" />
          <div className="h-4 w-24 rounded-lg bg-surface-container-high" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-12 rounded-lg bg-surface-container-high" />
        <div className="h-12 rounded-lg bg-surface-container-high" />
      </div>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { ready, token, user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    const panelPath = defaultPathForRole(user.role);
    if (panelPath !== "/") {
      navigateAfterAuth(router, user.role);
    }
  }, [ready, user, router]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/login?next=/account");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/auth/me", { token });
        if (!res.ok) {
          if (res.status === 401) {
            logout();
            router.replace("/login?next=/account");
            return;
          }
          throw new Error("Profil alınamadı.");
        }
        const data = (await res.json()) as UserProfile;
        if (!cancelled) setProfile(data);
      } catch {
        if (!cancelled) setError("Profil yüklenirken hata oluştu.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token, logout, router]);

  if (!ready || !token) {
    return (
      <div className="mx-auto max-w-lg px-margin-mobile py-16 text-center text-sm text-on-surface-variant md:px-margin-desktop">
        Yükleniyor…
      </div>
    );
  }

  if (user && defaultPathForRole(user.role) !== "/") {
    return (
      <div className="mx-auto max-w-lg px-margin-mobile py-16 text-center text-sm text-on-surface-variant md:px-margin-desktop">
        Yönlendiriliyorsunuz…
      </div>
    );
  }

  const displayName =
    profile?.customerProfile?.displayName?.trim() ||
    profile?.email ||
    user?.email ||
    "Hesabım";
  const initials = displayName.slice(0, 1).toUpperCase();
  const roleLabel = roleLabels[profile?.role ?? user?.role ?? ""] ?? "Hesap";

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

      <div className="relative mx-auto w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
            Hesabım
          </h1>
          <p className="mt-3 text-base text-on-surface-variant">
            Profil bilgileriniz ve hesap ayarları
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : !profile ? (
          <AccountSkeleton />
        ) : (
          <div className="glass-card rounded-2xl border border-outline-variant/35 p-6 shadow-2xl md:p-8">
            <div className="flex items-start gap-4">
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/20 font-display text-xl font-bold text-primary"
                aria-hidden
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-xl font-semibold text-on-surface">
                  {displayName}
                </h2>
                <span className="mt-2 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                  {roleLabel}
                </span>
              </div>
            </div>

            <dl className="mt-6 rounded-xl border border-outline-variant/25 bg-surface-container-low/30 px-4">
              <ProfileField label="E-posta" value={profile.email} />
              {profile.customerProfile?.displayName ? (
                <ProfileField
                  label="Görünen ad"
                  value={profile.customerProfile.displayName}
                />
              ) : null}
              <ProfileField
                label="Üyelik tarihi"
                value={formatDate(profile.createdAt)}
              />
            </dl>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/#explore"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-primary px-5 py-3 text-center text-sm font-bold text-on-primary transition-transform hover:scale-[0.98]"
              >
                Etkinlikleri keşfet
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.replace("/");
                  router.refresh();
                }}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-outline-variant/50 px-5 py-3 text-sm font-semibold text-on-surface-variant transition-colors hover:border-error/40 hover:text-error"
              >
                Çıkış yap
              </button>
            </div>

            <div className="mt-8 border-t border-outline-variant/25 pt-6">
              <DeleteAccountButton />
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-on-surface-variant">
          Canlı müzik etkinliklerini il ve ilçeye göre filtreleyerek
          keşfedebilirsiniz.
        </p>
      </div>
    </div>
  );
}
