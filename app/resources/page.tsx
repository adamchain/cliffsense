type Row = { label: string; value: string; note?: string };

function RefTable({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-base font-medium text-[var(--color-cs-text)]">{title}</h2>
      <div className="mt-3 overflow-x-auto rounded border border-[var(--color-cs-border)] bg-white">
        <table className="w-full border-collapse text-left text-[13px]">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-[var(--color-cs-border)] last:border-0 align-top">
                <td className="px-3 py-2 text-[var(--color-cs-text-secondary)]">{r.label}</td>
                <td className="px-3 py-2 font-medium tabular-nums text-[var(--color-cs-text)] whitespace-nowrap">
                  {r.value}
                </td>
                <td className="px-3 py-2 text-[12px] text-[var(--color-cs-text-secondary)]">{r.note ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 font-sans text-[var(--color-cs-text)]">
      <h1 className="text-2xl font-medium">Resources &amp; 2026 eligibility limits</h1>
      <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        Reference figures for 2026 (federal and Pennsylvania). These are informational ceilings only — SSA, PA DHS, and
        your county assistance office make the actual eligibility determinations. Always confirm with a benefits
        counselor before acting.
      </p>

      <div className="mt-6 rounded border border-[var(--color-cs-brand)] bg-[var(--color-cs-nav-hover)] px-4 py-3 text-[13px]">
        <span className="font-medium text-[var(--color-cs-text)]">10-day reporting rule.</span>{" "}
        <span className="text-[var(--color-cs-text-secondary)]">
          Report changes in income, assets, work, household, or marital status within 10 days — by the 10th of the month
          after the month the change happened (e.g. a change in April is reported by May 10). This applies to SSDI/DAC,
          Medicaid &amp; Waiver, QMB, Medicare Extra Help, and SNAP.
        </span>
      </div>

      <RefTable
        title="Social Security (SSDI / DAC)"
        rows={[
          {
            label: "SSDI — Substantial Gainful Activity (SGA), non-blind",
            value: "$1,690 / mo",
            note: "Gross earned income only. Earning above this (after the Trial Work Period / EPE) can end SSDI cash benefits.",
          },
          {
            label: "DAC (Disabled Adult Child)",
            value: "No earned-income cap",
            note: "Disability must have begun before age 22; recipient generally unmarried; parent on SS/SSDI or deceased. SGA still governs whether the disability is considered ongoing.",
          },
        ]}
      />

      <RefTable
        title="Medicare Part D Extra Help (LIS) — single, 2026"
        rows={[
          { label: "Monthly income", value: "$2,015 / mo", note: "$24,180 / year. SSDI, DAC, and wages all count." },
          { label: "Resource (asset) limit", value: "$18,090", note: "Excludes home, car, and personal items." },
        ]}
      />

      <RefTable
        title="Pennsylvania Medicaid & Waiver — 2026"
        rows={[
          {
            label: "HCBS / CHC Waiver — income",
            value: "$2,982 / mo",
            note: "300% of SSI FBR. SSDI + wages count; DAC excluded. Approval confers full Medicaid (deemed eligible).",
          },
          { label: "HCBS / CHC Waiver — assets", value: "$8,000", note: "Higher for married applicants (spousal impoverishment)." },
          { label: "Full Medicaid (ABD / Healthy Horizons) — income", value: "$1,330 / mo", note: "Single. SSDI counts; DAC excluded." },
          { label: "Full Medicaid (ABD) — assets", value: "$2,000", note: "$8,000 if Medicaid was entered through a waiver." },
          {
            label: "MAWD (Workers with Disabilities) — assets",
            value: "$8,000 / $2,400",
            note: "Keeps Medicaid/Waiver above SSDI's SGA limit; premium ~5% of countable income.",
          },
          { label: "QMB (Medicare Savings) — income", value: "$1,350 / mo", note: "100% FPL + $20. Pays Medicare premiums & cost-sharing." },
          { label: "QMB — resources", value: "~$9,660", note: "Single." },
        ]}
      />

      <RefTable
        title="Pennsylvania SNAP — gross monthly income (200% FPL), 2025–2026"
        rows={[
          { label: "Household of 1", value: "$2,610 / mo" },
          { label: "Household of 2", value: "$3,534 / mo" },
          { label: "Household of 3", value: "$4,458 / mo" },
          { label: "Household of 4", value: "$5,360 / mo" },
          { label: "Household of 5", value: "$6,284 / mo" },
          { label: "Household of 6", value: "$7,208 / mo", note: "Add ~$924 per additional person." },
          {
            label: "Resource limit",
            value: "$4,250",
            note: "Only if the household has an elderly/disabled member and fails the gross-income test; otherwise no asset limit.",
          },
        ]}
      />

      <p className="mt-3 text-[12px] text-[var(--color-cs-text-secondary)]">
        Note: SNT (Special Needs Trust) and ABLE account balances are excluded from countable assets across these
        programs.
      </p>

      <section className="mt-8">
        <h2 className="text-base font-medium text-[var(--color-cs-text)]">Official program links</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--color-cs-brand)]">
          <li>
            <a className="hover:underline" href="https://www.ssa.gov/oact/cola/sga.html">
              SSA — Substantial Gainful Activity (SGA)
            </a>
          </li>
          <li>
            <a className="hover:underline" href="https://www.ssa.gov/medicare/part-d-extra-help">
              Medicare Part D — Extra Help (LIS)
            </a>
          </li>
          <li>
            <a className="hover:underline" href="https://www.dhs.pa.gov/">
              Pennsylvania Department of Human Services
            </a>
          </li>
          <li>
            <a className="hover:underline" href="https://www.pahealthlaw.org/">
              Pennsylvania Health Law Project
            </a>
          </li>
          <li>
            <a className="hover:underline" href="https://www.fns.usda.gov/snap">
              SNAP (USDA)
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
