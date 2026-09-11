export type CategoryHandoff = {
  id: string;
  title: string;
  when: string;
  how: string;
  href: string;
  external?: boolean;
};

const ALL: CategoryHandoff[] = [
  {
    id: "mawd",
    title: "MAWD (working disabled Medicaid)",
    when: "Paid work continues and ABD/waiver/SSDI medical coverage is at risk.",
    how: "Apply in COMPASS/CAO before the current category closes. Premium is about 5% of countable income. Volunteer work does not qualify.",
    href: "https://www.compass.state.pa.us/",
    external: true,
  },
  {
    id: "1619b",
    title: "1619(b) Medicaid while SSI cash is $0",
    when: "Earned income zeros the SSI check but disability and other 1619(b) tests may still be met.",
    how: "Ask SSA and the CAO whether 1619(b) applies before assuming Medicaid ends with the cash benefit.",
    href: "https://www.ssa.gov/disabilityresearch/wi/1619b.htm",
    external: true,
  },
  {
    id: "waiver",
    title: "HCBS / CHC waiver Medicaid",
    when: "Income is over ABD but may still be under the waiver ceiling, and level-of-care continues.",
    how: "Confirm waiver/CHC enrollment and LOC. Financial renewal and functional reassessment are separate clocks.",
    href: "https://www.compass.state.pa.us/",
    external: true,
  },
  {
    id: "msp",
    title: "QMB / SLMB / QI (Medicare Savings Programs)",
    when: "QMB is ending or Medicare premiums reappear. SSDI cash stopping does not automatically decide MSP.",
    how: "Apply or recertify through COMPASS. Screen SLMB and QI if QMB resources are too high.",
    href: "https://www.compass.state.pa.us/",
    external: true,
  },
  {
    id: "marketplace",
    title: "Marketplace special enrollment",
    when: "MAGI Medicaid is ending after a current-month income increase.",
    how: "Use Medicaid loss as a special enrollment event and pick a plan so coverage can start when Medicaid ends.",
    href: "https://www.healthcare.gov/",
    external: true,
  },
  {
    id: "compass",
    title: "Another Medicaid category or SNAP recert",
    when: "Any DHS category is closing. File a new application in parallel with appeal/reconsideration.",
    how: "Submit in COMPASS and call the CAO to ask that the case transfer rather than close outright.",
    href: "https://www.compass.state.pa.us/",
    external: true,
  },
];

function pick(ids: string[]): CategoryHandoff[] {
  const set = new Set(ids);
  return ALL.filter((h) => set.has(h.id));
}

/** Next-category options to start before the current one closes. */
export function categoryHandoffsFor(programs: string[]): CategoryHandoff[] {
  const set = new Set(programs.map((p) => p.toUpperCase().replace(/[^A-Z0-9]/g, "")));
  if (set.size === 0) return ALL;
  const ids: string[] = [];
  if (set.has("SSI") || set.has("MEDICAIDABD") || set.has("MEDICAID")) {
    ids.push("1619b", "mawd", "waiver");
  }
  if (set.has("SSDI") || set.has("QMB") || set.has("EXTRAHELP")) ids.push("msp");
  if (set.has("MAWD")) ids.push("mawd", "waiver", "compass");
  if (set.has("MEDICAIDMAGI") || set.has("MEDICAID")) ids.push("marketplace", "compass");
  if (set.has("MEDICAIDWAIVER")) ids.push("mawd", "compass");
  if (set.has("SNAP")) ids.push("compass");
  const unique = [...new Set(ids)];
  return unique.length ? pick(unique) : ALL;
}
