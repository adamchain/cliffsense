export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 font-sans text-[var(--color-cs-text)]">
      <h1 className="text-2xl font-medium">Resources</h1>
      <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        Federal and state program links will be filtered by the beneficiary&apos;s state after you sign in. This
        public page is a placeholder for v1 static content and legal links.
      </p>
      <ul className="mt-6 space-y-2 text-sm text-[var(--color-cs-brand)]">
        <li>
          <a className="hover:underline" href="https://www.ssa.gov/">
            Social Security Administration
          </a>
        </li>
        <li>
          <a className="hover:underline" href="https://www.fns.usda.gov/snap">
            SNAP (USDA)
          </a>
        </li>
        <li>
          <a className="hover:underline" href="https://www.medicaid.gov/">
            Medicaid
          </a>
        </li>
      </ul>
    </div>
  );
}
