/**
 * Guides copy. Figures and clocks follow the 2026 program metadata and the
 * obligation rules (checked 2026-10-15). A printed agency notice wins when it
 * disagrees with an estimate.
 */

export type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "steps"; items: string[] }
  | { kind: "bullets"; items: string[] }
  | { kind: "defs"; items: { name: string; text: string }[] }
  | { kind: "note"; text: string }
  | { kind: "table"; caption: string; headers: [string, string, string]; rows: [string, string, string][] };

export type GuideArticle = {
  id: string;
  label: string;
  title: string;
  lede: string;
  blocks: Block[];
};

export type GuideGroup = { heading: string; articles: GuideArticle[] };

export type GuideBook = {
  id: string;
  label: string;
  /** Sidebar pill. Overview uses this for the landing. */
  homeId?: string;
  groups: GuideGroup[];
};

export const OVERVIEW_LEDE =
  "Start with the person, the programs, and the dates that can interrupt benefits. Bene-Watch keeps renewals, interim reports, reportable changes, reviews, and requests for proof on separate clocks.";

export const UPDATES: {
  date: string;
  title: string;
  body: string;
  articleId: string;
}[] = [
  {
    date: "October 15, 2026",
    title: "Each deadline stays on its own clock",
    body: "A renewal, an interim report, a change you must report, a disability or eligibility review, and a request for proof are separate obligations. The soonest open item is shown first.",
    articleId: "renewal-one",
  },
  {
    date: "October 2026",
    title: "Programs opens on the cards",
    body: "Programs shows a card for each program you receive. Open a card for that program's alerts, dates, and limits. Enrollment is chosen in Settings.",
    articleId: "feature-programs",
  },
  {
    date: "October 2026",
    title: "Word documents preview in the Vault",
    body: "A .docx filed in the Vault can be previewed in the app, in the folder and slot it belongs to.",
    articleId: "feature-vault",
  },
];

const LIMITS_TABLE: Block = {
  kind: "table",
  caption: "2026 figures Bene-Watch uses. Confirm with the agency before acting.",
  headers: ["Program", "2026 figure", "How to read it"],
  rows: [
    ["SSI", "$994 / $1,491 a month", "Federal Benefit Rate for an individual / an eligible couple. SSI pays that rate minus countable income."],
    ["SSDI", "$1,690 SGA · $1,210 TWP", "2026 non-blind substantial gainful activity, and the Trial Work Period service-month line. Blind SGA is unused until statutory blindness is recorded. DAC has no trial work period."],
    ["ABD Medicaid", "$1,330 / $1,804 income", "One person / two people. Resources are $2,000 for one person and $3,000 for two or more, or $8,000 when Medicaid was entered through a waiver."],
    ["MAGI Medicaid", "$1,836 / $2,489 income", "138% of poverty for one person / two. No asset test. Income equal to the limit still qualifies."],
    ["HCBS / CHC", "$2,982 gross · $8,000 resources", "Income equal to the limit still qualifies. Neither limit is used when the person receives SSI."],
    ["MAWD", "$3,325 / $4,509 countable", "One person / two. Resources are $10,000 or less. Workers with Job Success uses 600% of poverty and does not use the $10,000 cap."],
    ["QMB", "$1,350 / $1,824 income", "One person / a couple. Resources are $9,950 or $14,910. Keeping QMB deems Extra Help."],
    ["Extra Help", "Below $2,015 / $2,725 income", "One person / a couple. Resources must be below $18,090 or $36,100. Automatic while Medicaid, QMB, or SSI continues."],
    ["SNAP", "200% of poverty, gross", "Broad-based categorical eligibility for most Pennsylvania households, with no asset test. The dollar line depends on household size."],
    ["ABLE", "First $100,000 excluded", "Excluded from the SSI resource limit. A housing withdrawal still needs to be spent in the same calendar month."],
  ],
};

export const DOC_BOOKS: GuideBook[] = [
  {
    id: "overview",
    label: "Overview",
    homeId: "home",
    groups: [
      {
        heading: "Get started",
        articles: [
          {
            id: "quick-start",
            label: "Quick start",
            title: "Quick start",
            lede: "Five steps take you from a new account to a home screen that knows who is covered and which dates matter.",
            blocks: [
              {
                kind: "steps",
                items: [
                  "**Confirm the Monitor role.** Authority is not assumed from a power of attorney, or from using this app. Record who may act, and under what document.",
                  "**Record identity.** Name, date of birth, address, household, marital status, and how to reach the person.",
                  "**Screen each program.** During setup, mark Current, Possible, No, or Unknown. Name the exact Medicaid category — ABD, MAGI, waiver, MAWD, or QMB — rather than a generic “Medicaid.”",
                  "**Connect a bank, if you want estimates.** Read-only access through Plaid builds an income and resource baseline. You can skip this and still track dates and documents.",
                  "**Choose alert email.** An email goes out when an alert you opted into is created. Pick the address and the alert types in [[/settings#notifications|Settings]].",
                ],
              },
              {
                kind: "p",
                text: "After setup, the same choices live in the app: [[/limits|Programs]] opens on the cards, and each card holds that program's alerts, dates, and limits. Enrollment is in [[/settings#programs|Settings]]. [[/transactions|Money]] is the bank, and [[/calendar|Calendar]] is every open obligation.",
              },
              {
                kind: "note",
                text: "A short walkthrough inside the app highlights Home, Money, Limits, Calendar, Alerts, and Settings. Start it from [[/help|Help]]. You can run it again anytime.",
              },
            ],
          },
          {
            id: "connect-bank",
            label: "Connect a bank",
            title: "Connect a bank",
            lede: "A linked account lets Bene-Watch estimate income and resources. The link is optional, and it is read-only.",
            blocks: [
              {
                kind: "steps",
                items: [
                  "Open [[/transactions|Money]] and choose **Connect bank**.",
                  "Find the institution and sign in **on Plaid’s screen**. Bene-Watch never receives the banking username or password.",
                  "Pick the checking and savings accounts to link. Deposits and balances begin importing within a minute or two.",
                  "Return to Money and review categories, especially anything marked **Needs review**.",
                ],
              },
              {
                kind: "p",
                text: "Each connection syncs once a day. Add another institution anytime, or disconnect one from Money. Disconnecting removes that institution’s transactions from Bene-Watch.",
              },
              {
                kind: "note",
                text: "Access is read-only. Bene-Watch can see transactions and balances so it can do the math. It cannot move money. Access tokens are encrypted at rest.",
              },
            ],
          },
          {
            id: "confirm-programs",
            label: "Confirm programs",
            title: "Confirm programs",
            lede: "Limits, renewals, and interim reports load from the programs you mark as received. A generic Medicaid enrollment is not enough.",
            blocks: [
              {
                kind: "p",
                text: "Open [[/settings#programs|Settings]] and choose what this person receives. The list includes SSI, SSDI, DAC, SNAP, ABD Medicaid, MAGI Medicaid, HCBS / Community HealthChoices, MAWD, QMB, Extra Help, TANF, LIHEAP, ACA / Pennie, and ABLE.",
              },
              {
                kind: "p",
                text: "Open each program from [[/limits|Programs]] and record the next renewal or review date, and the interim report date when that program has one. Label every date **Confirmed by agency notice**, **Estimated from verified rules**, or **Needs confirmation**. SNAP also asks for the household’s reporting category.",
              },
              {
                kind: "note",
                text: "Extra Help is deemed while Medicaid, SSI, or QMB continues, so it does not need its own application during that time. A waiver service review, a QMB renewal, and a full Medicaid renewal are different dates.",
              },
            ],
          },
          {
            id: "categorize",
            label: "Categorize activity",
            title: "Categorize activity",
            lede: "Income estimates follow the category on each deposit. Most rows are labeled from the bank’s data. Anything marked Needs review waits for you.",
            blocks: [
              {
                kind: "defs",
                items: [
                  { name: "Earned income", text: "Wages, salary, commission, bonus. Counted toward earned-income tests, and grossed up from take-home pay." },
                  { name: "Benefit deposit", text: "SSDI, Social Security, disability, unemployment, pension, child support. Unearned income. Already at gross, so it is not grossed up." },
                  { name: "Other income", text: "Interest, dividends, refunds." },
                  { name: "Expense", text: "Money going out. Not income." },
                  { name: "Transfer", text: "A move between the person’s own accounts. Excluded so it is not counted twice." },
                  { name: "Needs review", text: "The import was not confident. The row is not counted until you set a category." },
                ],
              },
              {
                kind: "p",
                text: "To keep a one-off deposit — a gift, a reimbursement — out of the estimate, set it to Transfer or exclude it. Your edits stick and steer later auto-categorization.",
              },
              {
                kind: "p",
                text: "Repeating deposits, such as a paycheck or a monthly benefit, can be confirmed on [[/recurring|Recurring]]. A confirmed stream is what lets a projection warn you before the month ends.",
              },
            ],
          },
          {
            id: "alerts-email",
            label: "Turn on alerts",
            title: "Turn on alerts",
            lede: "Alerts appear in the app as soon as they are created. Email is optional, and you choose which kinds go out.",
            blocks: [
              {
                kind: "p",
                text: "In [[/settings#notifications|Settings → Email notifications]], set the address. Leave it blank to use the sign-in email. You can add other recipients. An email goes out when an alert of a selected type is created.",
              },
              {
                kind: "defs",
                items: [
                  { name: "Limit reached", text: "A threshold has been crossed." },
                  { name: "Approaching a limit", text: "Activity is on pace to cross a threshold." },
                  { name: "Trend changes", text: "A notable shift in income or balances." },
                  { name: "Eligibility cliffs", text: "SGA, the SSI federal benefit rate, waiver twilight, MAWD paths, and similar loss risks." },
                  { name: "Reporting deadlines", text: "Wage changes and 10-day or 10th-of-the-month reminders." },
                  { name: "SNT payment effects", text: "Cash versus shelter in-kind support versus a vendor payment that is excluded." },
                  { name: "ABLE suspension risk", text: "An ABLE balance near the $100,000 SSI cash-suspension line." },
                ],
              },
              {
                kind: "p",
                text: "Read and resolve them on [[/limits/alerts|Alerts]]. Repeat alerts are de-duplicated: a new note is raised when something changes or escalates, not on every daily sync.",
              },
            ],
          },
        ],
      },
      {
        heading: "Foundations",
        articles: [
          {
            id: "concepts",
            label: "Core concepts",
            title: "Core concepts",
            lede: "A few ideas explain every screen.",
            blocks: [
              {
                kind: "defs",
                items: [
                  { name: "Beneficiary", text: "The person whose benefits are being watched. Limits, deposits, dates, and documents belong to a beneficiary. One account can hold more than one person." },
                  { name: "Monitor", text: "The person using Bene-Watch to keep the record. A power of attorney does not by itself make someone the Monitor, and opening the app does not create legal authority." },
                  { name: "Program", text: "A benefit the person receives or may receive. The exact category decides which limits and which clocks load." },
                  { name: "Obligation", text: "One dated responsibility: a renewal or review, an interim report, a change that must be reported, or documents an agency asked for. Finishing one does not finish another." },
                  { name: "Estimate", text: "A figure built from categorized bank activity. It is a prompt to check. Eligibility is decided by the agency." },
                ],
              },
              {
                kind: "note",
                text: "You review prepared information and submit through the official channel. Bene-Watch does not file forms, decide eligibility, or connect to agency systems.",
              },
            ],
          },
          {
            id: "numbers",
            label: "How the numbers work",
            title: "How the numbers work",
            lede: "Bank activity becomes a handful of figures. Each program then tests the figure that belongs to it.",
            blocks: [
              {
                kind: "h",
                text: "Gross-up",
              },
              {
                kind: "p",
                text: "The bank shows take-home pay. Most programs count pre-tax gross. For Pennsylvania wages, Bene-Watch multiplies net earned income by **1.13** (FICA, Pennsylvania income tax, and a typical local earned-income tax). The factor is slightly conservative so the estimate does not overstate wages. Benefit deposits already arrive at gross, so they are left alone.",
              },
              {
                kind: "h",
                text: "Disregards",
              },
              {
                kind: "bullets",
                items: [
                  "**SNAP’s gross test** uses grossed-up wages plus benefit and other income, with no $20 or $65 disregard.",
                  "**ABD Medicaid and SSI-style counting** apply the $20 general exclusion, the $65 earned exclusion, and then half of the remaining earned income.",
                  "**QMB** uses the earned-income exclusions. Its published limit already includes the $20.",
                  "**Waiver income** is a gross test.",
                  "**Extra Help** uses the published limit, which already includes the $20, and is skipped when Medicaid, SSI, or QMB already provides it.",
                ],
              },
              {
                kind: "h",
                text: "Resources and the rest of the month",
              },
              {
                kind: "p",
                text: "The asset figure is the highest current balance across linked checking and savings accounts. Confirmed recurring deposits can be projected through the end of the month, which is what lets an alert arrive before a cap is crossed.",
              },
              {
                kind: "p",
                text: "Home cards say **On track**, **Near limit**, or **Over limit**. The Limits page uses **On track**, **Watch**, and **Review**. The warning line defaults to about 85% of the cap.",
              },
            ],
          },
          {
            id: "limits",
            label: "Limits",
            title: "Limits",
            lede: "[[/limits|Limits]] lists the reference caps for enrolled programs, plus any cap you add. Each row shows the dollar line, where it came from, and the current status.",
            blocks: [
              {
                kind: "bullets",
                items: [
                  "**Attach or detach** a system limit. A detached limit is not evaluated and will not alert.",
                  "**Add a custom limit** for a monthly earned-income or resource cap that is not bundled.",
                  "**What-if** sliders on Home and on a program page model a raise or a larger balance. Your saved data does not change. Reset clears the sandbox.",
                ],
              },
              LIMITS_TABLE,
              {
                kind: "p",
                text: "Pennie premium tax credits: for 2026 the 400% of poverty subsidy cliff is back. One dollar over, and the advance credit is $0. Report income and household changes to Pennie within about 30 days.",
              },
              {
                kind: "note",
                text: "These are the reference figures loaded for 2026. A determination notice, a county budget, or a counselor’s reading of the case controls when it differs.",
              },
            ],
          },
          {
            id: "calendar",
            label: "Calendar and deadlines",
            title: "Calendar and deadlines",
            lede: "Your renewal date is only one deadline. Some benefits also require reports between renewals, or prompt notice when circumstances change. Bene-Watch tracks each obligation separately.",
            blocks: [
              {
                kind: "defs",
                items: [
                  { name: "Next renewal or review", text: "Recertification, an SSI financial redetermination, a continuing disability review, or a waiver service review. Each is its own row." },
                  { name: "Next interim report", text: "A scheduled report between renewals, such as a SNAP semi-annual report (PA 564). The date is never calculated by splitting a renewal date." },
                  { name: "Changes you must report", text: "The clock depends on the program: the 10th of the next month for many SSA financial changes, within 10 days for Pennsylvania Medical Assistance, prompt work reports for SSDI and DAC." },
                  { name: "Documents requested", text: "Proof an agency asked for, with that notice’s due date." },
                ],
              },
              {
                kind: "p",
                text: "Every date is labeled Confirmed by agency notice, Estimated from verified rules, or Needs confirmation. When a notice disagrees with the expected schedule, the notice date stays on the calendar and the mismatch is flagged. Each obligation keeps its own preparation, submission, proof, agency acknowledgment, and follow-up.",
              },
              {
                kind: "p",
                text: "Open a date from [[/calendar|Calendar]] or from Home. The event page is where you prepare, and where you can ask the Advisor about that specific deadline.",
              },
            ],
          },
          {
            id: "not-modeled",
            label: "Outside the estimate",
            title: "Outside the estimate",
            lede: "The bars are a flag. Several rules that can keep a person eligible sit outside the math.",
            blocks: [
              {
                kind: "bullets",
                items: [
                  "A home, one vehicle, and other resource exclusions.",
                  "ABLE and special-needs-trust balances, beyond the SSI $100,000 ABLE screen.",
                  "The disabled adult child income exclusion.",
                  "Impairment-related work expenses and a subsidy that can bring countable earnings under SGA.",
                  "In-kind support living-arrangement rules beyond the presumed maximum value cap.",
                  "A projected 2027 rule, including MAGI work reporting, until the [[#policy|2026–27 policy]] screen says it applies to this person.",
                ],
              },
              {
                kind: "p",
                text: "A resource bar can read high while countable resources are still within the limit. Treat that as a reason to review the case, not as a decision that benefits have ended.",
              },
            ],
          },
        ],
      },
      {
        heading: "Explore",
        articles: [
          {
            id: "whats-new",
            label: "What's new",
            title: "What's new",
            lede: "What changed in the product and in the 2026 clocks this record uses.",
            blocks: [
              {
                kind: "defs",
                items: [
                  {
                    name: "October 15, 2026 — Separate obligations",
                    text: "Renewals, interim reports, reportable changes, disability and eligibility reviews, and requests for proof each keep their own date, confidence, and follow-up. A distant renewal cannot hide an earlier report.",
                  },
                  {
                    name: "October 2026 — Programs section",
                    text: "[[/limits|Programs]] opens on the cards. Open a card for that program's alerts, dates, and limits.",
                  },
                  {
                    name: "October 2026 — Vault preview",
                    text: "A Word document in the [[/vault|Vault]] can be previewed in place, including which slot it was filed under.",
                  },
                ],
              },
              {
                kind: "p",
                text: "Rule text in this guide was checked against the sources stored with each program on October 15, 2026. When those sources disagree, or a handbook page still needs a check, the date is marked Needs confirmation.",
              },
            ],
          },
          {
            id: "advisor",
            label: "Advisor",
            title: "Advisor",
            lede: "The Advisor answers plain-language questions using this person’s programs, dates, and estimates.",
            blocks: [
              {
                kind: "p",
                text: "Open [[/advisor|Advisor]], or use the ask field at the bottom of most screens. A deadline page can start the question for you: “Help me prepare for this deadline.”",
              },
              {
                kind: "p",
                text: "The answer sits on top of the same estimates the bars use. It is a helper for organizing the next step. Confirm anything that would change a filing, a job, or a trust payment with SSA, the county assistance office, Pennie, or a benefits counselor.",
              },
            ],
          },
          {
            id: "records",
            label: "Vault, forms, and exports",
            title: "Vault, forms, and exports",
            lede: "Three places hold the paper side of the case. They do different jobs.",
            blocks: [
              {
                kind: "defs",
                items: [
                  {
                    name: "Vault",
                    text: "[[/vault|Vault]] is the filing cabinet. Preset folders: Identity and authority, Social Security and SSI, Medicare and assistance, Medicaid / MAWD / HCBS, SNAP, Income / resources / household, SNT and ABLE, Notices / submissions / appeals, and Other. The SNT folder keeps the trust agreement, the legal trustee, the financial institution, and a manual disbursement register. A request or approval is not a completed payment. Bene-Watch does not connect to the trust’s bank. A filed Word document can be previewed.",
                  },
                  {
                    name: "Forms",
                    text: "[[/documents|Forms]] helps prepare the government forms that match enrolled programs, including guided questions. You review the result and submit it through the official channel.",
                  },
                  {
                    name: "Exports",
                    text: "[[/reports|Exports]] downloads activity and limit history — for example, to attach to a redetermination packet you submit yourself.",
                  },
                ],
              },
            ],
          },
          {
            id: "glossary",
            label: "Glossary",
            title: "Glossary",
            lede: "Short meanings for the words on the screens.",
            blocks: [
              {
                kind: "defs",
                items: [
                  { name: "Gross income", text: "Income before taxes and withholding. What most programs count." },
                  { name: "Countable income", text: "What remains after that program’s disregards." },
                  { name: "Resource / asset limit", text: "A cap on countable savings. A home, a vehicle, and ABLE or trust balances are often excluded. The estimate does not apply those exclusions." },
                  { name: "SGA", text: "Substantial gainful activity. For 2026, $1,690 a month gross for a non-blind worker. Used by SSDI, and by DAC with no trial work period." },
                  { name: "TWP", text: "Trial Work Period. For SSDI in 2026, gross earnings of $1,210 or more count as a service month. SSDI cash continues until nine service months are recorded. DAC has no trial work period." },
                  { name: "FBR", text: "Federal Benefit Rate. $994 for an individual and $1,491 for an eligible couple in 2026. SSI pays the FBR minus countable income." },
                  { name: "QMB", text: "Qualified Medicare Beneficiary. A Medicare Savings Program that pays Part A and Part B premiums and cost-sharing. It is not full Medicaid. Keeping it deems Extra Help." },
                  { name: "Waiver (HCBS / CHC)", text: "Home- and community-based Medicaid. The financial renewal and the annual service or level-of-care review are separate. SSI can establish financial eligibility and still leave the service review in place." },
                  { name: "SAR / PA 564", text: "The semi-annual report many SNAP households file between recertifications. It is a different deadline from the renewal." },
                  { name: "SNT", text: "Special needs trust. Assets inside it are generally not countable resources. How a payment leaves the trust can still matter, and SSI rules are not the same as Medicaid or other programs. The [[/vault#snt|Vault register]] records the request, approval, payment, and proof. It does not move trust funds or decide eligibility." },
                  { name: "ISM", text: "In-kind support and maintenance. Shelter a trust pays to a vendor is income, capped at the presumed maximum value. Food paid to a vendor has not counted since September 30, 2024. Cash paid to the beneficiary counts dollar for dollar." },
                  { name: "PMV", text: "Presumed maximum value. One-third of the individual FBR plus $20, about $351.33 in 2026. A large rent payment from a trust lowers the SSI check by about $331.33, not by the whole rent." },
                  { name: "Plaid", text: "The service that links a bank so balances and deposits can be read. Sign-in happens on Plaid’s screen." },
                  { name: "Date confidence", text: "Confirmed by agency notice, Estimated from verified rules, or Needs confirmation." },
                ],
              },
            ],
          },
        ],
      },
      {
        heading: "Available on",
        articles: [
          {
            id: "browser",
            label: "In a browser",
            title: "In a browser",
            lede: "Bene-Watch is the website you are using. Any current desktop browser can run the full record: Home, Calendar, Programs, Money, Forms, Vault, and Exports.",
            blocks: [
              {
                kind: "p",
                text: "Sign in at the same address on a computer you trust. The session stays on that browser until you sign out.",
              },
            ],
          },
          {
            id: "phone",
            label: "On your phone",
            title: "On your phone",
            lede: "The same site adapts to a phone or tablet. There is no separate App Store download.",
            blocks: [
              {
                kind: "p",
                text: "On iPhone, iPad, or Android you can add Bene-Watch to the home screen from the browser’s Share or Install menu. The installed icon opens the app without the browser toolbar. Alerts you opted into still arrive by email.",
              },
              {
                kind: "p",
                text: "The bottom bar on a phone jumps between Home, Calendar, Programs, Forms, and Money. Everything else, including Guides, is in the menu.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "features",
    label: "Features",
    groups: [
      {
        heading: "Everyday",
        articles: [
          {
            id: "feature-home",
            label: "Home",
            title: "Home",
            lede: "[[/dashboard|Home]] is the beneficiary you are watching, the program cards, and the next dates.",
            blocks: [
              {
                kind: "bullets",
                items: [
                  "The name at the top switches people, or opens sharing.",
                  "Federal programs and Pennsylvania programs show as wallet cards, with On track, Near limit, or Over limit.",
                  "Upcoming dates sit beside the cards. The soonest obligation of any kind is the one to open first.",
                  "What-if sliders model a change without writing it to the record.",
                ],
              },
            ],
          },
          {
            id: "feature-calendar",
            label: "Calendar",
            title: "Calendar",
            lede: "[[/calendar|Calendar]] is every open obligation, not a single renewal anniversary.",
            blocks: [
              {
                kind: "p",
                text: "Renewals and reviews, interim reports, change reports, and document requests stay on their own rows. A date confirmed by a notice is kept even when an expected schedule says something else. Open an event to prepare, record what you submitted, and keep the follow-up with that obligation only.",
              },
            ],
          },
          {
            id: "feature-programs",
            label: "Programs",
            title: "Programs",
            lede: "Programs opens on the cards. Each card holds that program's alerts, dates, and limits.",
            blocks: [
              {
                kind: "defs",
                items: [
                  { name: "Cards", text: "[[/limits|Programs]] opens on a card for each program you receive." },
                  { name: "Inside a program", text: "Open a card for that program's alerts, dates, and reference limits. Renewal and report dates are edited on that page." },
                  { name: "2026–27 policy", text: "[[/limits/policy|A screen for projected rules]]. Check whether a rule applies to this person before treating it as current." },
                ],
              },
            ],
          },
          {
            id: "feature-money",
            label: "Money",
            title: "Money",
            lede: "[[/transactions|Money]] is linked accounts and the category on each transaction.",
            blocks: [
              {
                kind: "p",
                text: "Connect a bank through Plaid, review Needs review rows, and exclude transfers. [[/recurring|Recurring]] is where a repeating paycheck or benefit is confirmed so the rest of the month can be projected. Nothing is estimated for an account you have not connected.",
              },
            ],
          },
          {
            id: "feature-limits",
            label: "Limits and what-if",
            title: "Limits and what-if",
            lede: "A limit row compares one estimate to one cap.",
            blocks: [
              {
                kind: "p",
                text: "Status on this page is On track, Watch, or Review. Detach a limit that does not apply. The what-if control replays the same comparison with a different wage or balance and leaves the stored transactions alone. The 2026 dollar lines are listed in [[#limits|Limits]] under Overview.",
              },
            ],
          },
        ],
      },
      {
        heading: "Records",
        articles: [
          {
            id: "feature-forms",
            label: "Forms",
            title: "Forms",
            lede: "[[/documents|Forms]] gathers the filings that match the programs on the record and walks through the questions.",
            blocks: [
              {
                kind: "p",
                text: "A guided form is a draft. You check it, then submit it on COMPASS, with SSA, with Pennie, or on the paper form the notice names. Bene-Watch does not transmit the form to the agency. Keep the submission receipt in the Vault under Notices, submissions, and appeals.",
              },
            ],
          },
          {
            id: "feature-vault",
            label: "Vault",
            title: "Vault",
            lede: "[[/vault|Vault]] is the set of folders a later caregiver should be able to open without reconstructing the case.",
            blocks: [
              {
                kind: "bullets",
                items: [
                  "Identity and authority — photo ID, Bene-Watch authorization, power of attorney, representative payee, authorized representative, guardianship, trustee or ABLE authority.",
                  "Social Security and SSI — benefit verification, award notices, work reports and receipts, continuing disability review.",
                  "Medicare and assistance — Parts A and B, the drug plan, QMB / SLMB / QI notices, Extra Help.",
                  "Medicaid, MAWD, and HCBS — the exact category notice, the renewal, the waiver service plan, MAWD premium and budget, Workers with Job Success.",
                  "SNAP, income and household, and notices, submissions, and appeals.",
                  "SNT and ABLE — trust agreement, legal trustee, financial institution, payment requests, approvals, confirmations, invoices, and a manual disbursement register. A personal bank link does not import trust-account transactions.",
                ],
              },
              {
                kind: "p",
                text: "A slot marked needed, with nothing filed, is the gap. Word documents can be previewed in the folder. Older uploads with a previous category still open.",
              },
            ],
          },
          {
            id: "feature-exports",
            label: "Exports",
            title: "Exports",
            lede: "[[/reports|Exports]] downloads the activity and limit history you choose to hand to a counselor or attach to a packet.",
            blocks: [
              {
                kind: "p",
                text: "An export is a copy for you. It is not a filing, and it is not sent to an agency.",
              },
            ],
          },
          {
            id: "feature-advisor",
            label: "Advisor",
            title: "Advisor",
            lede: "Same helper as [[#advisor|Advisor]] under Overview, opened from [[/advisor|its own page]] or from a deadline.",
            blocks: [
              {
                kind: "p",
                text: "Ask what a raise, a move, or a trust payment would do to the limits already on the record. Use the answer to decide what to verify. The Advisor does not submit a report and does not change a category for you.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "configuration",
    label: "Configuration",
    groups: [
      {
        heading: "Setup",
        articles: [
          {
            id: "config-identity",
            label: "Identity and household",
            title: "Identity and household",
            lede: "Household size and state change several dollar lines. They live in Settings and on the beneficiary.",
            blocks: [
              {
                kind: "p",
                text: "In [[/settings|Settings]], set the state and household size used for poverty-related limits. Record the person’s name, date of birth, address, and marital status on the beneficiary. A household member moving in or out can change Medicaid household size and SSI deeming, and it has its own reporting clock.",
              },
            ],
          },
          {
            id: "config-programs",
            label: "Programs and dates",
            title: "Programs and dates",
            lede: "Enrollment is edited in [[/settings#programs|Settings]] after the first screening. Renewal and report dates are edited on each program.",
            blocks: [
              {
                kind: "p",
                text: "Turn a program on or off in Settings, then open that program and save the renewal date and, where the program has an interim report, that date too. Set confidence from the notice in hand. For SNAP, pick the reporting category: Not sure yet, Simplified reporting (SAR), Elderly or disabled with earned income, or ESAP. If you are not sure, leave it on Not sure yet rather than assuming an exemption.",
              },
              {
                kind: "note",
                text: "During first-time setup the choices are Current, Possible, No, and Unknown, plus the exact Medicaid category. Settings is the screen you return to later to change enrollment.",
              },
            ],
          },
          {
            id: "config-alerts",
            label: "Alert email",
            title: "Alert email",
            lede: "In-app alerts are always recorded. Email follows the checkboxes in Settings.",
            blocks: [
              {
                kind: "p",
                text: "Open [[/settings#notifications|Settings]] and choose the mailbox, any additional recipients, and which of the seven alert types should send mail. Mail goes out when that alert is created. Turning a type off stops the email. It does not delete the in-app alert.",
              },
            ],
          },
          {
            id: "config-banks",
            label: "Banks",
            title: "Banks",
            lede: "Linked institutions are managed on [[/transactions|Money]].",
            blocks: [
              {
                kind: "p",
                text: "Connect another bank the same way as the first. Disconnect removes that institution’s transactions from the estimates. Sync runs daily. Categories you set survive later imports of the same deposit.",
              },
            ],
          },
          {
            id: "config-custom",
            label: "Custom limits",
            title: "Custom limits",
            lede: "A custom limit is a cap you add because the bundled list does not include it.",
            blocks: [
              {
                kind: "p",
                text: "On [[/limits|Limits]], add a monthly earned-income or resource cap, name it, and set the warning line. It is evaluated with the same On track / Watch / Review states. Detach it when it no longer applies. A custom limit is still an estimate you defined. It does not change the official rule.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "reporting",
    label: "Reporting",
    groups: [
      {
        heading: "Deadlines",
        articles: [
          {
            id: "renewal-one",
            label: "Renewal is one deadline",
            title: "Renewal is one deadline",
            lede: "Your renewal date is only one deadline. Some benefits also require reports between renewals or prompt notice when your circumstances change. Bene-Watch helps you track each obligation separately.",
            blocks: [
              {
                kind: "p",
                text: "The calendar shows four kinds of work, and the earliest open one comes first:",
              },
              {
                kind: "bullets",
                items: [
                  "**Next renewal or review** — recertification, SSI financial redetermination, continuing disability review, waiver service review.",
                  "**Next interim report** — a SNAP semi-annual report or another report the program schedules between renewals.",
                  "**Changes you must report** — income, resources, household, work, or address, on that program’s clock.",
                  "**Documents requested** — proof named in a notice, due on the notice’s date.",
                ],
              },
              {
                kind: "p",
                text: "Reporting a change to SNAP does not report it to SSA. Finishing a PA 564 does not finish a SNAP recertification. An Extra Help review does not renew Medicaid or QMB.",
              },
            ],
          },
          {
            id: "confidence",
            label: "Date confidence",
            title: "Date confidence",
            lede: "Every stored date says how sure it is.",
            blocks: [
              {
                kind: "defs",
                items: [
                  { name: "Confirmed by agency notice", text: "You entered the date from a letter, a COMPASS message, or another notice. This date is kept even if a handbook schedule suggests a different day." },
                  { name: "Estimated from verified rules", text: "The date follows a published frequency, such as “about month 6 of a 12-month SNAP certification.” Replace it when the form arrives." },
                  { name: "Needs confirmation", text: "The source is missing, sources disagree, or the Pennsylvania handbook page still has to be checked. Do not treat it as a due date until a notice names one." },
                ],
              },
            ],
          },
          {
            id: "snap",
            label: "SNAP reports",
            title: "SNAP reports",
            lede: "Pennsylvania SNAP uses broad-based categorical eligibility for most households: a gross-income limit of 200% of poverty and no asset test. Reporting still depends on the household category.",
            blocks: [
              {
                kind: "defs",
                items: [
                  { name: "Simplified reporting (SAR)", text: "Most households. A 12-month certification and a semi-annual report (PA 564) due by the date printed on the form, around month 6. That report is separate from recertification." },
                  { name: "Elderly or disabled, with earned income", text: "Every adult is 60 or older or has a disability, and someone works. A 24-month certification. Semi-annual reports still arrive between recertifications. Confirm the months on the notice." },
                  { name: "ESAP", text: "Every member is 60 or older or has a disability, and nobody has earned income. A 36-month certification. Whether a mid-period report is required is not confirmed in Bene-Watch — follow the notice." },
                  { name: "Not sure yet", text: "Check the approval notice. Do not assume a twice-yearly report or an exemption. Disability alone does not exempt a household." },
                ],
              },
              {
                kind: "p",
                text: "Under simplified reporting, tell the county within 10 days when gross income goes over 130% of poverty for the household size, when ABAWD hours fall below 80 a month, or when gambling winnings are $4,750 or more. An ordinary raise that stays under the 130% line waits for the semi-annual report. A person moving in usually waits for that report too, unless the case is on change reporting.",
              },
            ],
          },
          {
            id: "social-security",
            label: "Social Security clocks",
            title: "Social Security clocks",
            lede: "SSI, SSDI, DAC, and Extra Help do not share one calendar.",
            blocks: [
              {
                kind: "defs",
                items: [
                  { name: "SSI", text: "Report income, resources, living arrangements, and household changes by the 10th of the month after the change. Report wages by the 10th of each month. A financial redetermination and a continuing disability review arrive as separate notices." },
                  { name: "SSDI", text: "Report work and earnings promptly. There is no asset test and no monthly wage calendar. After nine Trial Work Period months, gross earnings at or above SGA ($1,690 a month, non-blind, 2026) can suspend the check for that month." },
                  { name: "DAC", text: "Report work and marriage promptly. There is no trial work period. Estimated gross earnings at or above the same SGA line can end the disability finding. A power of attorney does not create a DAC benefit." },
                  { name: "Extra Help", text: "Deemed while Medicaid, SSI, or QMB continues, and re-checked each year. An Extra Help-only case reports its own changes to SSA by the 10th of the month after the change. That report does not renew Medicaid or QMB." },
                ],
              },
              {
                kind: "h",
                text: "Trust payments and SSI",
              },
              {
                kind: "p",
                text: "Cash from a special needs trust to the beneficiary is unearned income, dollar for dollar, after the $20 general exclusion. Shelter paid to a vendor (rent, mortgage, property tax, gas, electric, water) is in-kind support, capped at the presumed maximum value — about $351.33 in 2026, which lowers the check by about $331.33. Food and other non-shelter bills paid to a vendor have not counted as in-kind support since September 30, 2024.",
              },
            ],
          },
          {
            id: "medicaid",
            label: "Medicaid, waiver, and QMB",
            title: "Medicaid, waiver, and QMB",
            lede: "Name the category. The clocks and the dollar lines are not interchangeable.",
            blocks: [
              {
                kind: "bullets",
                items: [
                  "**ABD / Healthy Horizons** — income, resources, household, and coverage changes within 10 days. The annual financial renewal is not a waiver service review, a QMB renewal, or an Extra Help application.",
                  "**MAGI** — income, household, address, and other coverage within 10 days. No asset test. Adults 19–64 use 138% of poverty.",
                  "**HCBS / Community HealthChoices** — financial and household changes within 10 days. The annual service or level-of-care review is separate from the financial renewal. SSI can meet the financial test and still leave the service review in place.",
                  "**MAWD** — income, resources, and employment within 10 days. Paid work is required. Workers with Job Success is a different resource rule.",
                  "**QMB** — income and resource changes within 10 days, on its own renewal notice. It is not full Medicaid and it does not renew a waiver.",
                ],
              },
            ],
          },
          {
            id: "policy",
            label: "2026–27 policy",
            title: "2026–27 policy",
            lede: "[[/limits/policy|2026–27 policy]] is where a projected rule is checked against this person before anyone treats it as current.",
            blocks: [
              {
                kind: "p",
                text: "The 2026 figures in [[#limits|Limits]] are the reference lines the app evaluates today. A rule described as projected for 2027 — including MAGI work-reporting hours — is not assumed to be in force. If a later rule does apply, the policy screen is the place to see that, and the proof to keep is pay stubs, timesheets, or an employer letter for the hours actually worked, after screening exemptions.",
              },
              {
                kind: "note",
                text: "Do not prepare a work-hours packet from a slide or a draft. Wait until the rule applies to this category, then follow the notice.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "security",
    label: "Security",
    groups: [
      {
        heading: "Your data",
        articles: [
          {
            id: "private",
            label: "What stays private",
            title: "What stays private",
            lede: "Bene-Watch is a private record for the household. It does not send income, balances, or documents to SSA, the county assistance office, Pennie, or any other agency.",
            blocks: [
              {
                kind: "p",
                text: "You decide what to export, what to put in a form, and what to submit on the agency’s own site. There is no reporting path out of the product. Sharing inside Bene-Watch is a separate invite, and you can revoke it.",
              },
            ],
          },
          {
            id: "bank-access",
            label: "Bank access",
            title: "Bank access",
            lede: "Bank sign-in happens on Plaid’s screen. Bene-Watch stores an encrypted access token, not the password.",
            blocks: [
              {
                kind: "bullets",
                items: [
                  "The connection is read-only. It cannot initiate a payment or a transfer.",
                  "The daily sync reads new transactions and refreshed balances for the accounts you picked.",
                  "Disconnecting an institution removes its transactions from the estimates.",
                ],
              },
              {
                kind: "p",
                text: "Details of retention and safeguards are on the [[/legal/security|Security]] and [[/legal/privacy|Privacy]] pages.",
              },
            ],
          },
          {
            id: "legal",
            label: "Legal",
            title: "Legal",
            lede: "Bene-Watch is not a government agency, an eligibility system, a law firm, or an official benefits representative.",
            blocks: [
              {
                kind: "p",
                text: "It does not guarantee eligibility, renewal, or continued coverage. Read the [[/legal/terms|Terms]], [[/legal/privacy|Privacy Policy]], [[/legal/security|Security]] page, and [[/legal/data-retention|Data retention]] policy. Questions about the product go to [[mailto:support@bene-watch.com|support@bene-watch.com]].",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    groups: [
      {
        heading: "Household",
        articles: [
          {
            id: "monitor",
            label: "The Monitor role",
            title: "The Monitor role",
            lede: "The Monitor is the person keeping this record. Legal authority to speak to an agency is a different fact, and it has to be on paper.",
            blocks: [
              {
                kind: "p",
                text: "File the document that actually applies in the Vault under Identity and authority: a power of attorney, SSA representative payee appointment, authorized representative form, guardianship order, or trustee / ABLE authority. Using Bene-Watch does not create any of those roles. A power of attorney does not by itself establish SSI, SSDI, or DAC.",
              },
            ],
          },
          {
            id: "sharing",
            label: "Beneficiaries and sharing",
            title: "Beneficiaries and sharing",
            lede: "One login can watch more than one person. Access for a family member is an invite, not an assumption.",
            blocks: [
              {
                kind: "steps",
                items: [
                  "Open [[/beneficiaries|Beneficiaries]] and select the person, or add one.",
                  "Invite by email. The invited person gets access only after they accept.",
                  "Revoke the invite when they should no longer see the record. Revocation takes effect on their next sign-in.",
                ],
              },
              {
                kind: "p",
                text: "Switch the active person from Home. Limits, the calendar, the bank, and the Vault all follow the person who is selected.",
              },
            ],
          },
          {
            id: "support",
            label: "Support",
            title: "Support",
            lede: "Product questions go to the team. Benefit questions go to the agency that decides the case.",
            blocks: [
              {
                kind: "bullets",
                items: [
                  "Email [[mailto:support@bene-watch.com|support@bene-watch.com]] for sign-in, bank connection, or a screen that looks wrong.",
                  "Use [[/advisor|Advisor]] for a question about the numbers already on the record.",
                  "Confirm a filing, a closure, or a dollar line with SSA, the county assistance office, COMPASS, Pennie, or a benefits counselor.",
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const USE_CASES: GuideBook = {
  id: "use-cases",
  label: "Use cases",
  groups: [
    {
      heading: "Situations",
      articles: [
        {
          id: "case-caregiver",
          label: "Caring for a family member",
          title: "Caring for a family member",
          lede: "A parent, sibling, or representative payee keeping SSI and Medical Assistance from slipping between notices.",
          blocks: [
            {
              kind: "p",
              text: "Put the person on the record, mark SSI and the exact Medicaid category, and file the authority document that lets you act. Enter the financial redetermination, the disability review, and the Medicaid renewal as separate dates. Connect the bank only if you want the income and resource estimate. The Vault is what the next person opens if you cannot.",
            },
          ],
        },
        {
          id: "case-mawd",
          label: "Working on MAWD",
          title: "Working on MAWD",
          lede: "Paid work is what makes Medical Assistance for Workers with Disabilities available, and the same wages can press against other programs.",
          blocks: [
            {
              kind: "p",
              text: "Categorize pay as earned income so the 1.13 gross-up runs. Watch the 2026 countable lines — $3,325 for one person, $4,509 for two — and the $10,000 resource cap, unless Workers with Job Success applies. Report income, resources, and employment to Pennsylvania DHS within 10 days. If SSDI is also on the record, the Trial Work Period and SGA are a second clock, not the MAWD clock.",
            },
          ],
        },
        {
          id: "case-snap",
          label: "A SNAP household",
          title: "A SNAP household",
          lede: "The renewal and the semi-annual report are both capable of closing the case. Submitting one does not finish the other.",
          blocks: [
            {
              kind: "p",
              text: "Set the reporting category on Programs. Most households are simplified reporting: 12 months, plus a PA 564 around month 6, due on the date the form prints. An elderly or disabled household with earnings still has interim reports on a 24-month certification. For ESAP, follow the notice — a mid-period report is not confirmed here. Disability alone is not an exemption. An ordinary raise under 130% of poverty waits for the semi-annual report.",
            },
          ],
        },
        {
          id: "case-ssdi",
          label: "SSDI and earnings",
          title: "SSDI and earnings",
          lede: "SSDI has no asset test. Work still has to be reported, and SGA is a gross-earnings line.",
          blocks: [
            {
              kind: "p",
              text: "Gross wages of $1,210 or more in 2026 count as a Trial Work Period service month. Work expenses are not subtracted from that test. After nine of those months, $1,690 or more (non-blind) can suspend the check for that month. A monthly impairment-related work expense you enter is subtracted from the SGA comparison. A subsidy is not. DAC uses the same SGA line and has no trial work period. A waiver’s $2,982 income limit can still be satisfied in a month when SSDI cash stops.",
            },
          ],
        },
        {
          id: "case-next",
          label: "The next caregiver",
          title: "The next caregiver",
          lede: "The point of the Vault and the calendar is that someone else can pick up the case without starting from a pile of mail.",
          blocks: [
            {
              kind: "p",
              text: "File identity, the authority document, the latest award letters, the exact Medicaid category notice, renewal and SAR dates, and every submission receipt. Invite that person from Beneficiaries when they should see it, and revoke the invite when they should not. The dates stay labeled with how they were confirmed, so a guessed anniversary is not mistaken for a notice.",
            },
          ],
        },
      ],
    },
  ],
};

export const TRAINING: GuideBook = {
  id: "training",
  label: "Training",
  groups: [
    {
      heading: "Practice",
      articles: [
        {
          id: "train-setup",
          label: "Five steps",
          title: "Five steps",
          lede: "Do this once for each person on the account.",
          blocks: [
            {
              kind: "steps",
              items: [
                "Create the beneficiary and say who the Monitor is.",
                "Screen programs, including the exact Medicaid category.",
                "Type the renewal date from the newest notice, and the interim date if the notice has one. Set the confidence.",
                "Connect a bank only if you want estimates, then clear Needs review rows.",
                "Turn on the alert emails you actually want to read.",
              ],
            },
            {
              kind: "p",
              text: "Then run the in-app tour from [[/help|Help]]. It walks Home, Money, Limits, Calendar, Alerts, and Settings.",
            },
          ],
        },
        {
          id: "train-home",
          label: "Read the home screen",
          title: "Read the home screen",
          lede: "Read the words before the bars.",
          blocks: [
            {
              kind: "bullets",
              items: [
                "On track means the estimate is under the warning line.",
                "Near limit means it has passed about 85% of the cap, or a projection says it will.",
                "Over limit means the estimate meets or passes the cap. Check exclusions the model skips before you assume a benefit ended.",
                "The date under Upcoming is the soonest open obligation, which may be a report or a document request rather than the renewal.",
              ],
            },
          ],
        },
        {
          id: "train-deadline",
          label: "Read a deadline",
          title: "Read a deadline",
          lede: "Open the event and answer four questions.",
          blocks: [
            {
              kind: "steps",
              items: [
                "What kind is it — renewal, interim report, change report, or documents?",
                "Is the date confirmed by a notice, estimated, or still needing confirmation?",
                "Does a different program still have its own date for the same life change?",
                "What proof will you file in the Vault after you submit through the official channel?",
              ],
            },
          ],
        },
        {
          id: "train-vault",
          label: "File proof",
          title: "File proof",
          lede: "Put the document in the slot the next person will look for.",
          blocks: [
            {
              kind: "p",
              text: "Open [[/vault|Vault]], choose the folder, and file against the named slot: the award letter under Social Security, the category notice under Medicaid, the SAR determination under SNAP, the receipt under Notices, submissions, and appeals. A Word file can be previewed so you can confirm you uploaded the right one.",
            },
          ],
        },
        {
          id: "train-advisor",
          label: "Ask the Advisor",
          title: "Ask the Advisor",
          lede: "Ask about a change you are considering, with the record already filled in.",
          blocks: [
            {
              kind: "p",
              text: "“What happens if these wages continue?” and “What do I gather for this deadline?” are the useful shapes. From a calendar event, the page can start that second question for you. Take the answer to the agency or a counselor before you send a form or change a trust payment.",
            },
          ],
        },
      ],
    },
  ],
};

export function articlesIn(book: GuideBook): GuideArticle[] {
  return book.groups.flatMap((group) => group.articles);
}

export function findArticle(id: string): { book: GuideBook; article: GuideArticle } | null {
  for (const book of [...DOC_BOOKS, USE_CASES, TRAINING]) {
    const article = articlesIn(book).find((item) => item.id === id);
    if (article) return { book, article };
  }
  return null;
}

export function articlePlainText(article: GuideArticle): string {
  const chunks: string[] = [article.title, article.label, article.lede];
  for (const block of article.blocks) {
    if (block.kind === "p" || block.kind === "h" || block.kind === "note") chunks.push(block.text);
    else if (block.kind === "steps" || block.kind === "bullets") chunks.push(...block.items);
    else if (block.kind === "defs") {
      for (const item of block.items) chunks.push(item.name, item.text);
    } else if (block.kind === "table") {
      chunks.push(block.caption, ...block.rows.flat());
    }
  }
  return chunks.join(" ");
}
