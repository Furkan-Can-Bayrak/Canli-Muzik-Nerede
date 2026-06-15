import { normalizeSearchText } from '../common/search-text.util';

export { normalizeSearchText as normalizeLocationName };

export function matchByName<T extends { name: string }>(
  candidates: T[],
  rawName: string | null | undefined,
): T | null {
  if (!rawName?.trim()) return null;
  const target = normalizeSearchText(rawName);
  if (!target) return null;

  const exact = candidates.find(
    (c) => normalizeSearchText(c.name) === target,
  );
  if (exact) return exact;

  const contains = candidates.find((c) => {
    const n = normalizeSearchText(c.name);
    return n.includes(target) || target.includes(n);
  });
  return contains ?? null;
}
