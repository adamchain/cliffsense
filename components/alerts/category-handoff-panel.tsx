import Link from "next/link";
import { categoryHandoffsFor, type CategoryHandoff } from "@/lib/alerts/category-handoffs";

export function CategoryHandoffPanel({
  programs,
  items,
}: {
  programs?: string[];
  items?: CategoryHandoff[];
}) {
  const rows = items ?? categoryHandoffsFor(programs ?? []);
  if (rows.length === 0) return null;
  return (
    <div className="mt-3 rounded-xl border border-[var(--color-cs-border)] bg-white/80 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
        Apply before this category closes
      </p>
      <ul className="mt-2 space-y-2">
        {rows.map((h) => (
          <li key={h.id} className="text-[12px] leading-snug">
            <p className="font-semibold text-[var(--color-cs-text)]">{h.title}</p>
            <p className="text-[var(--color-cs-text-secondary)]">{h.when}</p>
            <p className="mt-0.5 text-[var(--color-cs-text-secondary)]">{h.how}</p>
            {h.external ? (
              <a
                href={h.href}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-block font-medium text-[var(--color-cs-brand)]"
              >
                Open application site
              </a>
            ) : (
              <Link href={h.href} className="mt-0.5 inline-block font-medium text-[var(--color-cs-brand)]">
                Continue in app
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
