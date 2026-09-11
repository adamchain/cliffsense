export function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const iso = typeof value === "string" ? value : new Date(value).toISOString();
  return iso.slice(0, 10);
}
