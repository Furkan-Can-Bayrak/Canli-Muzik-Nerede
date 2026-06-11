import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-outline-variant/20 bg-surface-container-lowest py-12">
      <div className="mx-auto flex w-full max-w-container-max flex-col justify-between gap-12 px-margin-mobile md:flex-row md:px-margin-desktop">
        <div className="max-w-xs">
          <span className="font-display text-2xl font-extrabold text-primary">
            Canlı Müzik Nerede
          </span>
          <p className="mt-4 text-base text-on-surface-variant">
            Canlı müzik etkinliklerini keşfedin; işletme ve gruplarla güvenli
            şekilde buluşun.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-12">
          <div className="flex flex-col gap-4">
            <span className="font-semibold text-on-surface">Keşfet</span>
            <Link
              href="/"
              className="text-base text-on-surface-variant transition-colors hover:text-secondary"
            >
              Etkinlikler
            </Link>
            <Link
              href="/cafes"
              className="text-base text-on-surface-variant transition-colors hover:text-secondary"
            >
              Mekanlar
            </Link>
            <Link
              href="/bands"
              className="text-base text-on-surface-variant transition-colors hover:text-secondary"
            >
              Gruplar
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-semibold text-on-surface">Hesap</span>
            <Link
              href="/login"
              className="text-base text-on-surface-variant transition-colors hover:text-secondary"
            >
              Giriş
            </Link>
            <Link
              href="/register"
              className="text-base text-on-surface-variant transition-colors hover:text-secondary"
            >
              Kayıt ol
            </Link>
            <Link
              href="/account"
              className="text-base text-on-surface-variant transition-colors hover:text-secondary"
            >
              Hesabım
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-16 flex w-full max-w-container-max flex-col items-center justify-between gap-4 border-t border-outline-variant/15 px-margin-mobile pt-8 md:flex-row md:px-margin-desktop">
        <p className="text-xs text-on-surface-variant">
          © {new Date().getFullYear()} Canlı Müzik Nerede
        </p>
      </div>
    </footer>
  );
}
