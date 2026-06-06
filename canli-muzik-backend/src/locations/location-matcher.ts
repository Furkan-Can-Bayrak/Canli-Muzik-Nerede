export function normalizeLocationName(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u')
    .replace(/\s+/g, ' ');
}

export function matchByName<T extends { name: string }>(
  candidates: T[],
  rawName: string | null | undefined,
): T | null {
  if (!rawName?.trim()) return null;
  const target = normalizeLocationName(rawName);
  if (!target) return null;

  const exact = candidates.find(
    (c) => normalizeLocationName(c.name) === target,
  );
  if (exact) return exact;

  const contains = candidates.find((c) => {
    const n = normalizeLocationName(c.name);
    return n.includes(target) || target.includes(n);
  });
  return contains ?? null;
}
