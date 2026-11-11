/** "KES 6,500" — same format as the original site. */
export function kes(amount: number | null | undefined) {
  return `KES ${(amount ?? 0).toLocaleString("en-US")}`;
}

/** Django `truncatewords` — keeps the first N words and appends "…". */
export function truncateWords(text: string, words = 8) {
  const parts = text.trim().split(/\s+/);
  return parts.length > words ? `${parts.slice(0, words).join(" ")} …` : text;
}

/** "7% Off" ribbon — the original floors the percentage. */
export function discountPercent(price: number, oldPrice?: number | null) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.floor(((oldPrice - price) / oldPrice) * 100);
}

/** Store the 2x variant next to the 1x cache image (…/abc.webp → …/abc@2x.webp). */
export function srcSet(src?: string | null) {
  if (!src) return undefined;
  const m = src.match(/^(\/media\/cache\/.+)\.(webp|jpg|png)$/);
  return m ? `${src} 1x, ${m[1]}@2x.${m[2]} 2x` : undefined;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
