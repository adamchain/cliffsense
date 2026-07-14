/**
 * Pure-SVG bar chart of signups per day for the last 14 days. Server component —
 * no client JS. Bars scale to the busiest day; a flat all-zero series renders as
 * an empty baseline rather than dividing by zero.
 */
export function SignupSparkline({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <section className="rounded-lg border border-[var(--color-cs-border)] bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[13px] font-bold text-[var(--color-cs-text)]">
          New signups · last 14 days
        </h2>
        <span className="text-[12px] text-[var(--color-cs-text-secondary)]">
          {total} total
        </span>
      </div>
      <div className="flex items-end gap-1" style={{ height: 88 }}>
        {data.map((d) => {
          const pct = (d.count / max) * 100;
          const [, m, day] = d.date.split("-");
          return (
            <div
              key={d.date}
              className="group flex flex-1 flex-col items-center justify-end"
              title={`${m}/${day}: ${d.count} signup${d.count === 1 ? "" : "s"}`}
            >
              <div
                className="w-full rounded-t-sm bg-[var(--color-cs-brand)] transition-opacity group-hover:opacity-80"
                style={{ height: `${Math.max(pct, d.count > 0 ? 6 : 2)}%`, minHeight: 2 }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-[var(--color-cs-text-muted)]">
        <span>
          {data[0]?.date.slice(5).replace("-", "/")}
        </span>
        <span>{data[data.length - 1]?.date.slice(5).replace("-", "/")}</span>
      </div>
    </section>
  );
}
