import type { WheelEvent } from "react";

/** Tam sayı fiyat / adet alanları için güvenli ayrıştırma. */
export function parseIntegerField(value: string): number {
  return Number.parseInt(value.trim(), 10);
}

/** Sayı alanı odaktayken sayfa kaydırınca değerin değişmesini engeller. */
export function blurOnWheel(e: WheelEvent<HTMLInputElement>) {
  e.currentTarget.blur();
}
