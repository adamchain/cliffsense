/**
 * In-app interactive walkthrough steps, derived from Help → Quick start and the
 * core screens new users need after onboarding. Targets use `data-tour` attrs.
 */

export type WalkthroughStep = {
  id: string;
  /** Navigate here before spotlighting (null = stay put). */
  href: string | null;
  /** `data-tour` value. Null = centered card with no highlight. */
  target: string | null;
  title: string;
  body: string;
};

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: "welcome",
    href: "/dashboard",
    target: null,
    title: "Quick start tour",
    body: "Five minutes to learn the app. We'll walk through your home screen, programs, money, limits, calendar, and alerts — the same path as Help → Quick start.",
  },
  {
    id: "home",
    href: "/dashboard",
    target: "home-beneficiary",
    title: "Your home",
    body: "This is the beneficiary whose benefits you're tracking (that may be you). Tap the name anytime to switch people or manage sharing.",
  },
  {
    id: "programs",
    href: "/dashboard",
    target: "home-programs",
    title: "Programs at a glance",
    body: "Federal and Pennsylvania programs show as wallet cards — where you stand against each income or asset limit. Confirm enrolled programs so the right limits appear.",
  },
  {
    id: "upcoming",
    href: "/dashboard",
    target: "home-upcoming",
    title: "Upcoming deadlines",
    body: "Renewals, wage reports, and appointments land here. Open Calendar for the full schedule and 'do I need to report this?' guidance.",
  },
  {
    id: "money",
    href: "/transactions",
    target: "money-page",
    title: "Connect & categorize money",
    body: "Link a bank through Plaid (read-only). Deposits import automatically — review anything marked Unclear so earned income and benefits count the right way.",
  },
  {
    id: "limits",
    href: "/thresholds",
    target: "limits-page",
    title: "Limits",
    body: "Every reference limit for your programs lives here. Attach or detach system limits, add custom ones, and watch warning lines before a hard cap.",
  },
  {
    id: "calendar",
    href: "/calendar",
    target: "calendar-page",
    title: "Reporting calendar",
    body: "Deadlines and renewals in one place. Missing a scheduled report can suspend benefits — use this screen to stay ahead.",
  },
  {
    id: "alerts",
    href: "/alerts",
    target: "alerts-page",
    title: "Early alerts",
    body: "When activity approaches or crosses a limit, you get a Watch or Over-limit alert here — plus optional email and push from Settings.",
  },
  {
    id: "settings",
    href: "/settings",
    target: "settings-notifications",
    title: "Turn on notifications",
    body: "Choose email digests and push so you hear about risks before month-end. You can change these anytime.",
  },
  {
    id: "done",
    href: "/dashboard",
    target: null,
    title: "You're ready",
    body: "That's the quick start. Revisit Help anytime for deeper how-tos, or run this tour again from Help → Quick start.",
  },
];
