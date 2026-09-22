import { SntEstimator } from "@/components/benefits/snt-estimator";
import { SalarySntScenarios } from "@/components/benefits/salary-snt-scenarios";
import { EligibilityLossCatalog } from "@/components/benefits/eligibility-loss-catalog";
import { WorkPlanner } from "@/components/benefits/work-planner";
import { PolicyScreen } from "@/components/policy/policy-screen";

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
        <span className="font-medium text-[var(--color-cs-text)]">Reporting clocks differ by program.</span>{" "}
        <span className="text-[var(--color-cs-text-secondary)]">
          SSI and Extra Help: by the 10th of the month after the change (a change in April is reported by May 10).
          Medicaid, waiver, MAWD, and QMB: within 10 days. SSDI and DAC: promptly, with no fixed wage calendar. SNAP
          simplified reporting: within 10 days only if gross income exceeds 130% FPL, ABAWD hours drop below 80 a month,
          or gambling winnings are $4,750 or more. A raise that stays under 130% FPL waits for the semi-annual report.
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
            note: "Gross countable income. Equal to $2,982 still qualifies. Not used when the person receives SSI. A DAC benefit is left out.",
          },
          { label: "HCBS / CHC Waiver — assets", value: "$8,000", note: "One person: $2,000 plus a $6,000 disregard. Not used on SSI. A married couple's protected share is set at assessment." },
          {
            label: "MAGI Medicaid — assets",
            value: "No asset test",
            note: "Expansion adults 19–64 and MAGI families. Income is MAGI (about 138% FPL).",
          },
          { label: "Full Medicaid (ABD / Healthy Horizons) — income", value: "$1,330 / mo", note: "One person. Two is $1,804. SSI-countable income. The SSI payment and a DAC benefit are left out. SSDI counts." },
          { label: "Full Medicaid (ABD) — assets", value: "$2,000", note: "$3,000 for two or more. $8,000 if Medicaid was entered through a waiver. Not tested under age 21." },
          {
            label: "MAWD (Workers with Disabilities) — countable income",
            value: "$3,325 / mo",
            note: "250% FPL. Countable income after SSI-related exclusions — not a gross-wage cap. Premium ~5% of countable income.",
          },
          {
            label: "MAWD — assets",
            value: "$10,000",
            note: "Paid employment required. Workers with Job Success can extend coverage up to 600% FPL.",
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

      <RefTable
        title="SSI & Special Needs Trust distributions — 2026"
        rows={[
          {
            label: "SSI Federal Benefit Rate (FBR)",
            value: "$994 / mo",
            note: "Individual ($1,491 for an eligible couple). SSI pays the FBR minus countable income.",
          },
          {
            label: "SNT cash into a personal bank account",
            value: "Counts",
            note: "Money inside a qualifying SNT is usually excluded. Cash deposited to checking/savings is unearned income that month and a resource if kept into the next month. Prefer trustee-to-vendor payment.",
          },
          {
            label: "Shelter paid to a vendor (ISM)",
            value: "Capped ~$331 / mo",
            note: "Rent, mortgage, property tax, gas, electric, water. Counted at the Presumed Maximum Value (PMV = ⅓ FBR + $20 ≈ $351.33), so a $1,500 rent payment lowers the check by only ~$331.33 — leaving ~$662.67 plus fully-paid housing.",
          },
          {
            label: "Food / non-shelter paid to a vendor",
            value: "$0 impact",
            note: "Groceries, internet, phone, cable, tuition, clothing. Fully excluded — SSA removed food from In-Kind Support & Maintenance effective Sept 30, 2024 (89 FR 21246).",
          },
        ]}
      />

      <SntEstimator />

      <p className="mt-3 text-[12px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        Remember the formula, not the figure: <span className="font-medium text-[var(--color-cs-text)]">PMV = (⅓ × FBR) + $20</span>.
        Only the FBR changes each January with the COLA, and the cap follows from it. The rule of thumb: an SNT should pay
        vendors directly (never the beneficiary in cash), which limits any hit to the capped shelter reduction and makes
        food and non-shelter payments cost nothing in benefits.
      </p>

      <p className="mt-3 text-[12px] text-[var(--color-cs-text-secondary)]">
        Note: SNT (Special Needs Trust) and ABLE account balances are excluded from countable <em>assets</em> across these
        programs — separate from the <em>income</em> rules above, which govern how trust <em>payments</em> affect the monthly SSI check.
      </p>

      <PolicyScreen />

      <SalarySntScenarios />

      <WorkPlanner />

      <EligibilityLossCatalog />

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
