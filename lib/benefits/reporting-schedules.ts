import { programCodeKey } from "@/lib/benefits/program-meta";

/**
 * Reporting schedules, deadlines, and "what NOT to report" content, derived from
 * the PA Benefits Reporting Schedules UX spec (2026). Two failure modes drive the
 * design and split notifications into two tracks with different tone/urgency:
 *
 *  - "scheduled"  → missing a scheduled report can SUSPEND/CLOSE the benefit
 *                   (deadline countdowns, "benefits may stop" framing).
 *  - "event"      → missing an event-triggered report causes an OVERPAYMENT that
 *                   gets clawed back ("report now to stay accurate" framing).
 *
 * Procedural details vary by case type and several rules are mid-transition in
 * 2026 (HOTMA rollout, SNAP ABAWD, Pennie repayment caps) — always confirm with
 * the administering agency.
 */
export type ReportTrack = "scheduled" | "event";

export type ReportItem = {
  title: string;
  /** Plain-language detail of the obligation. */
  detail: string;
  /** Hard deadline pattern, e.g. "By the 10th of the next month". */
  deadline: string;
};

export type ReportChannel = {
  label: string;
  /** Deep-link to the correct filing tool, or a phone string. */
  url?: string;
  phone?: string;
};

export type ProgramSchedule = {
  code: string;
  /** Recurring paperwork on a clock (suspension risk). */
  scheduled: ReportItem[];
  /** Reports triggered by a life/financial change (overpayment risk). */
  eventTriggered: ReportItem[];
  /** Reassurance: things users commonly over-report that they don't need to. */
  doNotReport: string[];
  /** Where the report goes. */
  channel: ReportChannel;
  /** Optional 2026 caveat to surface as a banner. */
  caveat?: string;
};

const COMPASS: ReportChannel = {
  label: "COMPASS / MyCOMPASS PA",
  url: "https://www.compass.state.pa.us/",
};

export const REPORTING_SCHEDULES: Record<string, ProgramSchedule> = {
  SSI: {
    code: "SSI",
    scheduled: [
      {
        title: "Monthly wage report (if working)",
        detail:
          "If you (or a deemor spouse/parent) work, report last month's GROSS wages — ideally during the first 6 days of the month. Capture pay stubs (gross amount and pay dates).",
        deadline: "By the 6th of each month",
      },
      {
        title: "Redetermination",
        detail:
          "Periodic review of income, resources, and living arrangement — by mail, every 1–6 years depending on your case.",
        deadline: "On the date in your mailed packet",
      },
    ],
    eventTriggered: [
      {
        title: "Income, resource, household & living changes",
        detail:
          "Report income changes (earned and unearned), resources approaching/exceeding $2,000 ($3,000 couple), a change in who pays for food/shelter, household/marital changes, a move, leaving the U.S. 30+ days, entering/leaving a hospital or institution, or incarceration.",
        deadline: "By the 10th of the month after the change",
      },
    ],
    doNotReport: [
      "SNAP benefits",
      "Federal tax refunds / EITC / CTC",
      "Deposits into an ABLE account within limits",
      "The SSI payment itself",
      "The annual COLA (automatic — no report needed)",
    ],
    channel: {
      label: "SSI Mobile Wage app / myWageReport",
      url: "https://www.ssa.gov/ssi/wage-reporting.html",
      phone: "866-772-0953",
    },
    caveat:
      "Late wage-report penalties escalate ($25 → $50 → $100). Entering wages in the first week each month avoids them.",
  },
  SSDI: {
    code: "SSDI",
    scheduled: [
      {
        title: "Continuing Disability Review (CDR)",
        detail: "Periodic medical review — there is no monthly or annual paperwork to file.",
        deadline: "When SSA schedules it (by mail)",
      },
    ],
    eventTriggered: [
      {
        title: "Work & earnings changes",
        detail:
          "Report promptly when you start/stop work or change hours or pay; crossing the $1,210 Trial Work Period trigger; crossing $1,690 / $2,830 SGA; receiving/changing workers' comp or public disability; incarceration; address change; marriage/divorce (affects family benefits); or medical improvement.",
        deadline: "Promptly / as soon as possible (no fixed calendar)",
      },
    ],
    doNotReport: [
      "Assets / bank balances — there is NO asset test for SSDI",
      "Passive/unearned income (interest, dividends, rental, VA disability)",
      "Pensions from Social-Security-covered jobs",
      "A spouse's income",
    ],
    channel: {
      label: "my Social Security / SSA-821 / local office",
      url: "https://www.ssa.gov/myaccount/",
    },
    caveat:
      "SSDI has no asset test — bank-balance changes are a common source of needless worry. The reportable universe is essentially work and earnings.",
  },
  SNAP: {
    code: "SNAP",
    scheduled: [
      {
        title: "Semi-Annual Report (SAR)",
        detail:
          "A short update around month 6 — no interview. Miss it and benefits are suspended until you submit. (The 'pink envelope' is the SAR — don't ignore it.)",
        deadline: "By the date printed on the form",
      },
      {
        title: "Recertification",
        detail:
          "Full recert at 12 months (up to 24 months if every household member is 60+ or disabled with no earned income). Packets are mailed automatically.",
        deadline: "By the date printed on the renewal packet",
      },
    ],
    eventTriggered: [
      {
        title: "The 3 simplified-reporting triggers (within 10 days)",
        detail:
          "Under semi-annual/simplified reporting, report only: (1) total household gross income rises above 130% FPL for your size; (2) an ABAWD's work hours drop below 80/month; (3) lottery/gambling winnings of $4,500+ in a single game.",
        deadline: "Within 10 days of the trigger",
      },
    ],
    doNotReport: [
      "A raise that keeps you under 130% FPL — waits for the SAR",
      "A new job within limits — waits for the SAR",
      "A household member moving in — waits for the SAR",
      "Changes in rent / utilities / medical expenses",
      "Buying a car or building savings (PA has no asset test)",
    ],
    channel: { label: "COMPASS / MyCOMPASS PA", url: "https://www.compass.state.pa.us/", phone: "877-395-8930" },
    caveat:
      "A minority of cases are on full 'change reporting' (typically zero-income or all-elderly/disabled households) with broader duties — confirm your case type.",
  },
  MEDICAID: {
    code: "MEDICAID",
    scheduled: [
      {
        title: "Annual renewal / redetermination",
        detail:
          "A date-driven packet is mailed each year. Children get 12-month continuous eligibility. Renewal is the main benefit-loss risk — treat the packet as top priority.",
        deadline: "By the date on the renewal packet",
      },
    ],
    eventTriggered: [
      {
        title: "Income, household, address & coverage changes",
        detail:
          "Report income changes, household-size changes, address changes, and gaining other health coverage. ABD and long-term-care enrollees also report assets (near the $2,000 limit); MAGI categories do not.",
        deadline: "Generally within ~10 days",
      },
    ],
    doNotReport: [
      "Assets / bank balances for MAGI categories (children, pregnant, parents, expansion adults) — no asset test",
    ],
    channel: COMPASS,
    caveat: "Reporting branches on category: MAGI (no asset test) vs. ABD/LTC ($2,000 asset limit).",
  },
  SECTION8: {
    code: "SECTION8",
    scheduled: [
      {
        title: "Annual reexamination + NSPIRE inspection",
        detail:
          "Your Public Housing Authority reexamines income/composition once a year and inspects the unit. Dates are PHA-set.",
        deadline: "On the schedule set by your PHA",
      },
    ],
    eventTriggered: [
      {
        title: "Household composition change → always report",
        detail:
          "Adding/removing a member, a live-in aide, or a foster child/adult. Under HOTMA, a 0% threshold applies — an interim reexam happens even if rent doesn't move.",
        deadline: "Per your PHA's interim-reporting rule",
      },
      {
        title: "Income decrease of 10%+ → report to lower your rent",
        detail:
          "Report a 10%+ income drop to get a rent reduction, effective the first of the month after the change if reported timely.",
        deadline: "Report promptly to avoid a back-charge",
      },
    ],
    doNotReport: [
      "A mid-year raise generally doesn't raise your rent — earned-income increases are excluded from interim reexams and picked up at the next annual",
      "Income changes under the 10% de minimis don't trigger an interim",
    ],
    channel: { label: "Your PHA portal / PHA office" },
    caveat:
      "HOTMA is in phased rollout (full multifamily compliance Jan 1, 2027) and PHA policies vary — confirm your PHA's current rules.",
  },
  TANF: {
    code: "TANF",
    scheduled: [
      {
        title: "Semi-Annual Report (SAR)",
        detail:
          "Every 6 months (the same CFSAR system as SNAP — often one combined task in COMPASS), plus periodic redetermination.",
        deadline: "By the date printed on the SAR form",
      },
    ],
    eventTriggered: [
      {
        title: "Budget-affecting changes (~10 days)",
        detail:
          "Report income/employment changes, household changes, address, assets crossing the $1,000 resource limit, and RESET work-activity hour changes.",
        deadline: "Within ~10 days",
      },
    ],
    doNotReport: [
      "Minor changes that don't affect the cash budget — wait for the SAR",
      "Modest wage changes — the 50% earned-income disregard means they may not move your grant",
    ],
    channel: { label: "COMPASS / County Assistance Office", url: "https://www.compass.state.pa.us/" },
    caveat: "There's a 60-month (5-year) lifetime TANF clock for an adult head-of-household — keep it in mind.",
  },
  WIC: {
    code: "WIC",
    scheduled: [
      {
        title: "Certification appointments",
        detail:
          "Roughly every 6 months (children sometimes ~12). Income and category are re-checked at the appointment — model these as visits to attend, not paperwork to file.",
        deadline: "On your scheduled appointment date",
      },
    ],
    eventTriggered: [
      {
        title: "Contact info & category changes",
        detail:
          "No ongoing income reporting. Update your contact info, and report a move out of state or leaving the category (e.g., a child turning 5, the end of the postpartum window).",
        deadline: "When it happens",
      },
    ],
    doNotReport: [
      "Routine income fluctuation between certifications",
      "If you're adjunctively eligible (on SNAP/Medicaid/TANF), that carries the income test through the cert period",
    ],
    channel: { label: "Your WIC clinic / app", url: "https://www.pawic.com/" },
  },
  LIHEAP: {
    code: "LIHEAP",
    scheduled: [
      {
        title: "Seasonal application",
        detail:
          "One application per heating season (~November–March). No ongoing reporting after you're awarded. Apply early — funds are limited and can run out.",
        deadline: "Before the season's application deadline",
      },
    ],
    eventTriggered: [
      {
        title: "Crisis (emergency) — separate application",
        detail:
          "No event reporting for the Cash component once awarded. Crisis is a separate emergency application for a shutoff, no fuel, or a broken furnace — not a 'report.'",
        deadline: "Apply as soon as the emergency arises",
      },
    ],
    doNotReport: ["Income changes after you're awarded for the season"],
    channel: { label: "COMPASS / county LIHEAP", url: "https://www.compass.state.pa.us/" },
  },
  ACA: {
    code: "ACA",
    scheduled: [
      {
        title: "Annual Open Enrollment",
        detail:
          "Renew and re-estimate your income for next plan year. Open Enrollment runs Nov 1 – mid-January. Mid-year enrollment needs a Special Enrollment Period (job loss, marriage, birth, move).",
        deadline: "Before Open Enrollment closes (~Jan 15)",
      },
    ],
    eventTriggered: [
      {
        title: "Income & household changes (within 30 days)",
        detail:
          "Report income changes, household changes (marriage, birth/adoption, move), and changes in other coverage (a job-based offer, Medicaid eligibility). Update your income estimate in Pennie.",
        deadline: "Within 30 days of the change",
      },
    ],
    doNotReport: [
      "Assets (no asset test)",
      "If your income estimate still holds, nothing month-to-month is required",
    ],
    channel: { label: "Pennie.com", url: "https://www.pennie.com/" },
    caveat:
      "2026 stakes are higher: repayment caps were eliminated. If actual income exceeds your estimate (or crosses 400% FPL), you may owe back ALL advance credits at tax time — keep your estimate current to avoid a tax bill.",
  },
  VA: {
    code: "VA",
    scheduled: [
      {
        title: "No annual report",
        detail:
          "Compensation: COLA is automatic. Pension: the annual Eligibility Verification Report (EVR) was discontinued Dec 20, 2012 — the VA now verifies income via IRS/SSA data matching. (Old Law / Section 306 protected-pension recipients may still get EVRs.)",
        deadline: "None",
      },
    ],
    eventTriggered: [
      {
        title: "Compensation — dependents & address",
        detail:
          "Report dependency changes (marriage, new child, a child aging out at 18/23, divorce, a dependent's death) and address / direct-deposit changes. Income and assets do NOT affect compensation.",
        deadline: "When it happens",
      },
      {
        title: "Pension — income & net worth",
        detail:
          "Report income and net-worth changes when they occur (don't wait for a form). Submit unreimbursed medical expenses on VA Form 21P-8416 to claim deductions that raise your payment (only UMEs above 5% of MAPR count).",
        deadline: "When it happens",
      },
    ],
    doNotReport: [
      "Compensation: income, assets, or other benefits — none of it affects compensation",
      "Pension: routine SS/VA COLA changes (the VA already has them)",
    ],
    channel: { label: "VA.gov", url: "https://www.va.gov/", phone: "800-827-1000" },
    caveat: "Split VA into two surfaces: compensation = dependents/address only; pension = income & net-worth changes.",
  },
};

export function scheduleFor(program: string): ProgramSchedule | null {
  return REPORTING_SCHEDULES[programCodeKey(program)] ?? null;
}

// ---------------------------------------------------------------------------
// "Do I need to report this?" matrix — keyed by change type × program.
// report: "yes" | "no" | "maybe". The single best place to cut over-reporting.
// ---------------------------------------------------------------------------
export type ReportVerdict = "yes" | "no" | "maybe";

export type ChangeType = {
  key: string;
  label: string;
  /** Per-program verdicts, keyed by UPPERCASE program code. */
  byProgram: Record<string, { verdict: ReportVerdict; note: string }>;
};

const Y = (note: string) => ({ verdict: "yes" as const, note });
const N = (note: string) => ({ verdict: "no" as const, note });
const M = (note: string) => ({ verdict: "maybe" as const, note });

export const CHANGE_TYPES: ChangeType[] = [
  {
    key: "job",
    label: "Started or changed a job",
    byProgram: {
      SSI: Y("Report by the 10th of next month; report monthly wages."),
      SSDI: Y("Report promptly — work and earnings are the core SSDI report."),
      SNAP: M("Only if total gross income rises above 130% FPL for your size."),
      MEDICAID: Y("Report income changes within ~10 days."),
      SECTION8: M("A raise waits for the annual; report an income drop ≥10% to lower rent."),
      TANF: Y("Report budget-affecting changes within ~10 days."),
      WIC: N("Routine income changes wait for your next certification."),
      LIHEAP: N("No ongoing reporting after you're awarded for the season."),
      ACA: Y("Update your income estimate in Pennie within 30 days."),
      VA: M("Compensation: no. Pension: yes — report income changes."),
    },
  },
  {
    key: "raise",
    label: "Got a raise (still under limits)",
    byProgram: {
      SSI: Y("Report by the 10th of next month."),
      SSDI: Y("Report the earnings change promptly."),
      SNAP: N("Waits for the SAR as long as you stay under 130% FPL."),
      MEDICAID: Y("Report income changes within ~10 days."),
      SECTION8: N("Earned-income increases are excluded until your annual reexam."),
      TANF: M("Report if it affects your cash budget; the 50% disregard may absorb it."),
      WIC: N("Routine fluctuation waits for the next cert."),
      LIHEAP: N("No reporting after award."),
      ACA: Y("Keep your Pennie estimate current within 30 days."),
      VA: M("Compensation: no. Pension: yes."),
    },
  },
  {
    key: "assets",
    label: "Bank balance / savings changed",
    byProgram: {
      SSI: Y("Report as resources approach $2,000 ($3,000 couple)."),
      SSDI: N("No asset test for SSDI — nothing to report."),
      SNAP: N("PA has no SNAP asset test for most households."),
      MEDICAID: M("MAGI: no. ABD/LTC: yes, near the $2,000 limit."),
      SECTION8: M("Report if net assets exceed $105,574 (HOTMA)."),
      TANF: Y("Report as assets approach the $1,000 resource limit."),
      WIC: N("No asset test."),
      LIHEAP: N("No asset test."),
      ACA: N("No asset test."),
      VA: M("Compensation: no. Pension: yes — net worth counts ($163,699 limit)."),
    },
  },
  {
    key: "household",
    label: "Someone moved in or out",
    byProgram: {
      SSI: Y("Household and living-arrangement changes affect SSI — report by the 10th."),
      SSDI: M("Report if it affects family/auxiliary benefits."),
      SNAP: N("A member moving in waits for the SAR (simplified reporting)."),
      MEDICAID: Y("Household-size changes affect eligibility — report within ~10 days."),
      SECTION8: Y("Always report composition changes (HOTMA 0% threshold)."),
      TANF: Y("Report household changes within ~10 days."),
      WIC: N("Not an ongoing WIC report."),
      LIHEAP: N("No reporting after award."),
      ACA: Y("Report household changes within 30 days."),
      VA: M("Compensation: dependency changes only (marriage, new child, etc.)."),
    },
  },
  {
    key: "address",
    label: "Moved / new address",
    byProgram: {
      SSI: Y("Report your move by the 10th of next month."),
      SSDI: Y("Report the address change."),
      SNAP: Y("Report the address (no benefit change mid-cycle, but they need it)."),
      MEDICAID: Y("Report the address change within ~10 days."),
      SECTION8: Y("A move affects your voucher — coordinate with your PHA."),
      TANF: Y("Report the address change."),
      WIC: Y("Update your contact info with the clinic."),
      LIHEAP: N("No reporting after award; update next application."),
      ACA: Y("A move can change your plan area — report within 30 days."),
      VA: Y("Update your address / direct deposit."),
    },
  },
  {
    key: "passive",
    label: "Got VA disability or other passive income",
    byProgram: {
      SSI: Y("Counts as unearned income (after the $20 exclusion) — report it."),
      SSDI: N("No asset test and passive income doesn't affect SSDI."),
      SNAP: Y("Counts as income for SNAP."),
      MEDICAID: Y("Counts as income — report within ~10 days."),
      SECTION8: Y("Counts toward your rent calculation."),
      TANF: Y("Counts as income — report it."),
      WIC: M("Counts toward the income test, re-checked at cert."),
      LIHEAP: N("No reporting after award."),
      ACA: Y("Counts toward MAGI — update your Pennie estimate."),
      VA: N("Not applicable to your VA benefit itself."),
    },
  },
];

// ---------------------------------------------------------------------------
// Fixed-window upcoming events — generated from rules, no personal dates needed.
// Personal dated deadlines (SAR/renewal printed dates) are user-entered.
// ---------------------------------------------------------------------------
export type GeneratedEvent = {
  /** ISO date (YYYY-MM-DD) the window/event lands on. */
  date: string;
  program: string;
  track: ReportTrack;
  title: string;
  detail: string;
  channelLabel: string;
  channelUrl?: string;
  /** True for recurring windows (e.g. monthly wage report). */
  recurring: boolean;
};

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * Generate the next fixed-window reporting events for the enrolled programs,
 * relative to `now`. These are the events whose timing is knowable from the
 * rules alone (SSI monthly wage window, LIHEAP heating season, Pennie OE).
 */
export function fixedScheduleEventsForPrograms(programs: string[], now: Date): GeneratedEvent[] {
  const set = new Set(programs.map(programCodeKey));
  const out: GeneratedEvent[] = [];
  const year = now.getFullYear();

  if (set.has("SSI")) {
    // Monthly "report last month's wages" window closes on the 6th. Surface the
    // current month if it's still open, otherwise next month's window.
    const day = now.getDate();
    const base =
      day <= 6 ? new Date(year, now.getMonth(), 6) : new Date(year, now.getMonth() + 1, 6);
    out.push({
      date: iso(base),
      program: "SSI",
      track: "scheduled",
      title: "Report last month's wages",
      detail:
        "If you worked last month, report your gross wages by the 6th in the SSI Mobile Wage app or myWageReport.",
      channelLabel: "SSI Mobile Wage app / myWageReport",
      channelUrl: "https://www.ssa.gov/ssi/wage-reporting.html",
      recurring: true,
    });
  }

  if (set.has("LIHEAP")) {
    // Heating-season application opens ~Nov 1 each year.
    const open = new Date(year, 10, 1); // Nov 1
    const next = now > open ? new Date(year + 1, 10, 1) : open;
    out.push({
      date: iso(next),
      program: "LIHEAP",
      track: "scheduled",
      title: "LIHEAP heating-season application opens",
      detail:
        "Apply early once the ~Nov–Mar season opens — funds are limited and can run out. No ongoing reporting after you're awarded.",
      channelLabel: "COMPASS / county LIHEAP",
      channelUrl: "https://www.compass.state.pa.us/",
      recurring: true,
    });
  }

  if (set.has("ACA")) {
    // Pennie Open Enrollment opens ~Nov 1 and closes ~Jan 15. Surface the next
    // meaningful date: the close (if OE is open now) or the next open.
    const jan15 = new Date(year, 0, 15);
    const nov1 = new Date(year, 10, 1);
    let next: Date;
    let opening: boolean;
    if (now <= jan15) {
      next = jan15; // OE is open now → closes ~Jan 15
      opening = false;
    } else if (now < nov1) {
      next = nov1; // before this year's OE → opens Nov 1
      opening = true;
    } else {
      next = new Date(year + 1, 0, 15); // OE open now (Nov/Dec) → closes next Jan 15
      opening = false;
    }
    out.push({
      date: iso(next),
      program: "ACA",
      track: "scheduled",
      title: opening ? "Pennie Open Enrollment opens" : "Pennie Open Enrollment closes",
      detail:
        "Open Enrollment runs Nov 1 – mid-January. Renew and re-estimate your income for the next plan year; mid-year changes need a Special Enrollment Period.",
      channelLabel: "Pennie.com",
      channelUrl: "https://www.pennie.com/",
      recurring: true,
    });
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}
