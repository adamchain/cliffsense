import { eventLabel } from "@/lib/applications/labels";

/* Presentational, hook-free parts shared by the applicant page (client) and the
 * public status page (server). */

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-[#e7f4e2] text-[#2f6d1a]" },
  rejected: { label: "Not approved", className: "bg-[#fbe7e8] text-[#a4262c]" },
  pending_review: { label: "Under review", className: "bg-[#fff2dc] text-[#8a5a12]" },
};

export function ApplicationStatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending_review;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ApplicationTimeline({
  events,
}: {
  events: { type: string; at: string; note: string }[];
}) {
  if (events.length === 0) return null;
  const ordered = [...events].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  return (
    <ol className="space-y-3">
      {ordered.map((e, i) => (
        <li key={i} className="flex gap-3">
          <span
            aria-hidden
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-cs-brand)]"
          />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[var(--color-cs-text)]">{eventLabel(e.type)}</p>
            {e.note ? (
              <p className="mt-0.5 text-[12px] text-[var(--color-cs-text-secondary)]">{e.note}</p>
            ) : null}
            <p className="mt-0.5 text-[11px] text-[var(--color-cs-text-muted)]">{fmt(e.at)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
