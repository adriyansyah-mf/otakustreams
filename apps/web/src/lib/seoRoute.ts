export function makeSeoKey(id: number, title: string): string {
  const slug = slugify(title);
  return `${id}-${slug || "detail"}`;
}

export function parseIdFromSeoKey(key: string): number | null {
  const m = /^(\d+)(?:-|$)/.exec(key);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

