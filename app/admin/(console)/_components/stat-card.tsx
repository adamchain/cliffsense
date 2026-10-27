import Link from "next/link";

export type StatTone = "default" | "danger" | "success" | "warning" | "info";

const TONE: Record<StatTone, string> = {
  default: "text-[var(--color-cs-text)]",
  danger: "text-[var(--color-cs-danger)]",
  success: "text-[var(--color-cs-success)]",
  warning: "text-[var(--color-cs-warning)]",
  info: "text-[var(--color-cs-info)]",
};

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: StatTone;
  href?: string;
}) {
  const body = (
    <>
      <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${TONE[tone]}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-[var(--color-cs-text-muted)]">{hint}</div>}
    </>
  );
  const cls =
    "block rounded-lg border border-[var(--color-cs-border)] bg-white p-3.5 sm:p-4";
  if (href) {
    return (
      <Link href={href} className={`${cls} transition-colors hover:bg-[var(--color-cs-surface)]`}>
        {body}
      </Link>
    );
  }
  return <div className={cls}>{body}</div>;
}
