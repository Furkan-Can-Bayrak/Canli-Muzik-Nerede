export function isPastEvent(event: {
  startAt: string | null;
  endAt?: string | null;
}): boolean {
  const now = new Date();
  if (event.endAt) {
    return new Date(event.endAt) < now;
  }
  if (event.startAt) {
    const dayEnd = new Date(event.startAt);
    dayEnd.setHours(23, 59, 59, 999);
    return dayEnd < now;
  }
  return false;
}

/** Yaklaşanlar önce (tarihe göre), günü geçmişler sonda. */
export function sortExploreEvents<
  T extends { startAt: string | null; endAt?: string | null },
>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const aPast = isPastEvent(a);
    const bPast = isPastEvent(b);
    if (aPast !== bPast) return aPast ? 1 : -1;

    const aTs = a.startAt
      ? new Date(a.startAt).getTime()
      : Number.MAX_SAFE_INTEGER;
    const bTs = b.startAt
      ? new Date(b.startAt).getTime()
      : Number.MAX_SAFE_INTEGER;

    return aPast ? bTs - aTs : aTs - bTs;
  });
}
