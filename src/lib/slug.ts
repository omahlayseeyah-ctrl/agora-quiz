export function slugify(title: string) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const random = Math.random().toString(36).slice(2, 7);
  return `${base || "quiz"}-${random}`;
}
