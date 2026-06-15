/** Arama için Türkçe/ASCII duyarsız metin (küçük harf + aksan sadeleştirme). */
export function normalizeSearchText(value: string): string {
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

export function escapeLikePattern(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

export function turkishLikePattern(rawTerm: string): string | null {
  const normalized = normalizeSearchText(rawTerm);
  if (!normalized) return null;
  return `%${escapeLikePattern(normalized)}%`;
}
