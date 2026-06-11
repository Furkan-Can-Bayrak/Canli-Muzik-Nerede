type RouterLike = { replace: (href: string) => void };

/** Default landing path after login or registration. */
export function defaultPathForRole(role: string | undefined): string {
  switch (role) {
    case "CAFE":
      return "/panel/cafe";
    case "BAND":
      return "/panel/band";
    default:
      return "/";
  }
}

export function canUseMessages(role: string | undefined): boolean {
  return role === "CAFE" || role === "BAND";
}

/** Login sonrası veya oturum açıkken güvenli hedef yolu seçer. */
export function resolvePostLoginPath(
  role: string | undefined,
  nextPath: string,
): string {
  if (!nextPath || nextPath === "/") {
    return defaultPathForRole(role);
  }
  if (nextPath.startsWith("/messages") && !canUseMessages(role)) {
    return defaultPathForRole(role);
  }
  if (nextPath.startsWith("/panel/cafe") && role !== "CAFE") {
    return defaultPathForRole(role);
  }
  if (nextPath.startsWith("/panel/band") && role !== "BAND") {
    return defaultPathForRole(role);
  }
  return nextPath;
}

/** Login / kayıt sonrası yönlendirme; App Router takılırsa tam sayfa yüklemesi dener. */
export function navigateAfterAuth(
  router: RouterLike,
  role: string | undefined,
  nextPath = "/",
): void {
  const target = resolvePostLoginPath(role, nextPath);
  if (
    typeof window !== "undefined" &&
    window.location.pathname === target
  ) {
    return;
  }
  router.replace(target);
  if (typeof window === "undefined") return;
  window.setTimeout(() => {
    const current = window.location.pathname;
    const stuckOnAuth =
      current === "/register" ||
      current === "/login" ||
      current.startsWith("/login?");
    if (stuckOnAuth && current !== target) {
      window.location.assign(target);
    }
  }, 200);
}
