"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useUnreadMessageCount } from "@/hooks/use-unread-message-count";

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`text-base transition-colors duration-200 ${
        active
          ? "border-b-2 border-primary pb-1 font-bold text-primary"
          : "font-medium text-on-surface-variant hover:text-primary"
      }`}
    >
      {children}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { ready, token, user, logout } = useAuth();
  const onHome = pathname === "/";
  const canUseMessages =
    ready && (user?.role === "CAFE" || user?.role === "BAND");
  const activeConversationId = pathname.match(/^\/messages\/([^/]+)/)?.[1] ?? null;
  const { count: unreadCount } = useUnreadMessageCount(
    token,
    user?.id,
    Boolean(canUseMessages),
    activeConversationId,
  );

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/30 bg-surface/75 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-container-max flex-wrap items-center justify-between gap-x-4 gap-y-3 px-margin-mobile py-4 md:px-margin-desktop">
        <div className="flex items-center gap-6 md:gap-10">
          <Link
            href="/"
            className="font-display text-xl font-extrabold tracking-tighter text-primary"
          >
            Canlı Müzik Nerede
          </Link>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:gap-6 md:text-base">
            <NavLink href="/" active={onHome}>
              Keşfet
            </NavLink>
            <NavLink href="/bands" active={pathname.startsWith("/bands")}>
              Gruplar
            </NavLink>
            <NavLink href="/cafes" active={pathname.startsWith("/cafes")}>
              Mekanlar
            </NavLink>
            <NavLink
              href="/events"
              active={
                pathname === "/events" || pathname.startsWith("/events/")
              }
            >
              Etkinlikler
            </NavLink>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
          {canUseMessages ? (
            <Link
              href="/messages"
              className={`relative inline-flex items-center gap-1.5 text-base transition-colors hover:text-primary ${
                pathname.startsWith("/messages")
                  ? "font-bold text-primary"
                  : unreadCount > 0
                    ? "font-semibold text-primary"
                    : "font-medium text-on-surface-variant"
              }`}
            >
              Mesajlar
              {unreadCount > 0 ? (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
              ) : null}
            </Link>
          ) : null}
          {!ready ? (
            <span className="text-on-surface-variant">…</span>
          ) : user ? (
            <>
              <Link
                href="/account"
                className="text-base font-medium text-on-surface-variant transition-colors hover:text-primary"
              >
                Hesabım
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-full border border-outline-variant/50 px-3 py-2 text-base text-on-surface transition-colors hover:border-primary/40 hover:text-primary"
              >
                Çıkış
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-base font-medium text-on-surface-variant transition-colors hover:text-primary"
              >
                Giriş
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-primary px-5 py-2 text-base font-bold text-on-primary transition-transform hover:scale-[0.98]"
              >
                Kayıt ol
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
