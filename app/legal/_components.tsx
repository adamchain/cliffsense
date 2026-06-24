import type { ReactNode } from "react";

/* ----------------------------------------------------------------------------
 * Shared presentational helpers for the legal/compliance pages. The content of
 * each policy is taken verbatim from the MyBenefitsPA "Counsel Review Draft 1.0"
 * compliance package and rendered with the site's design tokens.
 * ------------------------------------------------------------------------- */

export function DocHeader({
  title,
  intro,
}: {
  title: string;
  intro?: ReactNode;
}) {
  return (
    <header className="border-b border-[var(--color-cs-border)] pb-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-cs-accent-orange)]">
        Comprehensive Website Compliance Package
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-cs-navy)] sm:text-4xl">
        {title}
      </h1>

      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--color-cs-border)]">
        <table className="w-full border-collapse text-left text-[13px]">
          <tbody>
            {[
              ["Company", "MyBenefitsPA Inc."],
              ["Website", "www.mybenefitspa.com"],
              ["Document Status", "Counsel Review Draft 1.0"],
              ["Document Date", "June 23, 2026"],
              ["Public Contact", "support@mybenefitspa.com | privacy@mybenefitspa.com"],
            ].map(([label, value]) => (
              <tr
                key={label}
                className="border-b border-[var(--color-cs-border)] last:border-0 align-top odd:bg-[var(--color-cs-surface)]"
              >
                <td className="w-44 px-4 py-2.5 font-medium text-[var(--color-cs-text-secondary)]">
                  {label}
                </td>
                <td className="px-4 py-2.5 text-[var(--color-cs-text)]">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 rounded-lg border border-[var(--color-cs-brand)] bg-[var(--color-cs-info-bg)] px-4 py-3 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        This document is a comprehensive compliance-policy draft for a Plaid-connected public-benefits
        technology platform. It is designed for final review by Delaware corporate counsel, privacy
        counsel, benefits counsel, and the company security lead before publication or operational
        reliance. The policy uses &ldquo;where applicable&rdquo; language for legal regimes that may
        depend on the company&apos;s role, customers, data flows, contracts, and states of operation.
      </div>

      {intro ? (
        <p className="mt-5 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
          {intro}
        </p>
      ) : null}
    </header>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-[var(--color-cs-navy)]">{title}</h2>
      <div className="mt-3 space-y-4 text-[15px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        {children}
      </div>
    </section>
  );
}

export function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-base font-semibold text-[var(--color-cs-text)]">{title}</h3>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        {children}
      </div>
    </div>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-[var(--color-cs-brand)]">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-cs-border)]">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr className="bg-[var(--color-cs-navy)] text-white">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[var(--color-cs-border)] last:border-0 align-top odd:bg-[var(--color-cs-surface)]"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 leading-relaxed text-[var(--color-cs-text)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
