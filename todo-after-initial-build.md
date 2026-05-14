# CliffSense v1 — Beta Readiness Gap Analysis

Audit date: 2026-05-14
Scope: Everything required to put the app in front of real beneficiaries, family members, caregivers, non-profits, and agencies who will rely on it to monitor and forecast benefit-threshold risk.

The current code is a solid skeleton: auth + onboarding + Plaid link/sync + transaction list + recurring streams + a working threshold evaluator + alerts table + vault shell + exports (CSV/JSON only). The data model in `lib/db/models/*` largely tracks the spec in `core-instructions.md`. But several of the features you specifically called out — the Robinhood-style chart, "treat similar transactions as income once one is marked", letting users exclude or disregard specific transactions, a real library of hard-coded limits, and shared family/agency access — are either stubs or missing entirely.

Below is everything that needs to land before beta, grouped by capability and tagged P0 (blocker), P1 (needed for credible beta), P2 (polish that can slip a sprint).

---

## 1. Dashboard / Robinhood-style visualization (mostly missing)

**Current state.** `app/(authenticated)/dashboard/page.tsx` is four static cards. "Earned income", "Asset balance", and "Active alerts" all render `—`. No charts anywhere in the codebase. `package.json` has no chart library (`recharts`, `chart.js`, `d3`, `visx`, or `lightweight-charts` are all absent). Threshold rows on `/thresholds` are a plain table — no progress bars, no trajectory.

**Gaps.**
- **P0** Install a chart library (recommend `recharts` — already supported by your React 19/Next 15 stack and lightweight). Avoid d3 unless you need it.
- **P0** Build a `<ThresholdSparkline />` component: 60–90 day rolling earned-income or asset-balance line, with the threshold drawn as a horizontal reference line and a shaded "watch" band at `warnAtPercent`. This is the Robinhood-style hero chart.
- **P0** Dashboard "hero": one large chart per active threshold the user is closest to breaching, with the daily/weekly cumulative line + a dotted projected line through month-end (you already compute `projectedValueCents` server-side — wire it in).
- **P0** Hover scrubbing: show the exact value + date when the user hovers, same affordance as Robinhood. Recharts `<Tooltip />` covers this.
- **P1** Time-range toggle (1M / 3M / 6M / YTD / 1Y) like Robinhood. Server needs a `/api/transactions/series?bucket=day|week&from=&to=` endpoint that returns aggregated cents-per-bucket; that endpoint does not exist.
- **P1** Sparklines in each threshold row on `/thresholds`. Tiny inline trend so you don't have to drill in.
- **P1** Animated transitions on data load (Recharts `animationDuration` + a skeleton loader). Robinhood's polish is half about motion.
- **P1** Replace the static stat cards on the dashboard with live values from `loadThresholdDashboardPayload` (it's already implemented in `lib/thresholds/threshold-dashboard.ts` but the dashboard page never calls it).
- **P1** "Cliff" visualization: a stacked area showing earned + projected + remaining-headroom, plus a marker for when projected breach would occur if recurring streams continue.
- **P2** Color-state ring around the avatar/threshold (green/amber/red) in nav, similar to Robinhood's portfolio status indicator.

---

## 2. Smart transaction classification + ignore/exclude (largely missing)

This is your "after a recurring charge is marked once as income, detect future ones legitimately" + "let users remove or disregard transactions from the monitor" requirement. The data model doesn't support it yet.

**Current state.**
- `Transaction` model has `userCategory` enum only: `earned_income | benefit_deposit | other_income | expense | transfer | unclear`. There is no `excludedFromThresholds`, no `ruleAppliedId`, no notes.
- Manual recategorization at `PATCH /api/transactions/:id` only updates that one row — it does not propagate to similar past or future transactions.
- `RecurringStream.userCategory` likewise only governs the stream's projection contribution; it doesn't tag historical transactions belonging to that stream. The schema has no `transactions[].recurringStreamId` back-pointer even though the spec calls for it.
- `lib/plaid/sync-recurring.ts:guessUserCategory` is a hand-rolled regex on `(SSA|SSI|payroll|gusto|adp|paychex|...)`. Not user-extensible.
- There is no "rules" or "merchant memory" collection. No grep hits for `excludeFrom`, `ignored`, `excluded`, `mute`, `disregard` in the app code.
- `sumEarnedInflowTransactionsCents` only counts rows where `userCategory === "earned_income"` — so excluding effectively means re-tagging as "transfer" or "other_income", which is fragile and hides the user's intent.

**Gaps.**
- **P0** Add fields to `Transaction` schema: `excludedFromThresholds: Boolean` (default false), `excludeReason: string`, `recurringStreamId: ObjectId | null`, `notes: string`, `appliedRuleId: ObjectId | null`, `lastUserEditedAt: Date`. Migrate existing records.
- **P0** New `ClassificationRule` collection:
  ```
  { _id, beneficiaryId, scope: 'merchant' | 'description-regex' | 'amount-range' | 'recurring-stream',
    matcher: { merchantName?, descriptionRegex?, amountMinCents?, amountMaxCents?, recurringStreamId? },
    action: { userCategory?, excludeFromThresholds?: boolean, reason?: string },
    createdByUserId, createdAt, active: bool }
  ```
- **P0** On recategorize, surface a modal: *"Apply to all 14 similar past transactions and future matches? [Just this one] [All from this merchant] [Use a custom rule]"*. The Plaid sync should then evaluate the rule chain after upsert so future imports auto-classify.
- **P0** "Don't count this toward thresholds" toggle on each transaction row and each recurring stream. Driven by `excludedFromThresholds`. Update `metrics.ts` to skip excluded rows on every aggregation (currently they would still pass through if `userCategory === 'earned_income'`).
- **P0** When the user confirms a recurring stream as `earned_income`, **back-fill** the matching historical transactions with `recurringStreamId` and `userCategory = 'earned_income'`. Today that propagation does not exist; only the projection (forward-looking) uses the stream's category.
- **P1** Bulk select on `/transactions` with a "Recategorize as…" / "Exclude from thresholds" action.
- **P1** Per-account exclusion on `BankConnection.accounts[*].excludeFromAssetThreshold` — e.g. a parent's savings account that's linked for visibility only. Currently `maxCheckingSavingsBalanceCents` only filters by type==credit; it has no opt-out.
- **P1** Per-transaction "Split" UI — split a $1,200 deposit into $800 income + $400 gift/reimbursement.
- **P1** Show a banner on the dashboard when an unreviewed `unclear` transaction would materially change a threshold's status if classified as `earned_income` — nudges users to clean up before alerts mislead them.
- **P2** "Why is this counted?" explainer popover on the threshold chart that lists the contributing transactions and lets you exclude inline.

---

## 3. Threshold library (very thin)

**Current state.** `lib/thresholds/system-seeds.ts` ships exactly 4 system thresholds: SSDI TWP, SSI/SSDI SGA non-blind, SSI individual resources $2,000, SSI couple resources $3,000. Spec calls for at least 12 baseline rows and state-by-state expansion. There is no admin UI to add or update seeds (`/admin/thresholds/page.tsx` is a placeholder list view — no create/update form). No `effectiveTo`-versioned overlays. State field exists on the model but is always null.

**Gaps.**
- **P0** Add the missing federal seeds enumerated in §8 of `core-instructions.md`:
  - SSI Federal Benefit Rate (individual & couple) — unearned income reference
  - SSI SGA blind ($2,700/mo 2025)
  - SNAP gross + net income by household size (HH=1…8) — needs household-size matcher (`passesHouseholdRule` only knows about SSI couple/individual today)
  - ABLE annual contribution ($19,000) — needs a new `thresholdType: 'annual_contribution'`
  - Medicare Extra Help / LIS thresholds
  - VA Pension MAPR figures
- **P0** State-aware Medicaid (non-MAGI) for top 10 states; SNAP state add-ons for CA/NY/TX/FL; Section 8 by HUD AMI bands. Build the data table even if you start with manual values.
- **P0** Admin CRUD on `/admin/thresholds`: create, version (effectiveFrom/effectiveTo), deprecate. Today only `ensureSystemThresholdsSeeded()` writes; there is no PATCH path.
- **P0** Annual COLA update flow: a script + admin UI that creates a new `Threshold` row with the new `limitCents` and `effectiveFrom = Jan 1`, while setting the old row's `effectiveTo = Dec 31 prior year`. Currently `effectiveFrom` defaults to `2025-01-01` and there is no `2026-01-01` set.
- **P0** Per-beneficiary custom thresholds already work for `monthly_earned_income` and `asset_balance` only. Open the UI to all `thresholdType`s the spec defines: `monthly_unearned_income`, `annual_income`, `transaction_amount`, `custom`. The `Threshold` model already supports them; the evaluator's `switch` falls through with `continue;` for anything else, silently ignoring them.
- **P1** User ability to **disable** a system threshold for their beneficiary without deleting it ("I know this doesn't apply to me"). Today they cannot. Add a `ThresholdOverride { beneficiaryId, thresholdId, disabled: bool, customLimitCents?, note }` collection so user choices survive seed updates.
- **P1** Show the `effectiveFrom` / `sourceUrl` in the row's "Source" link and tooltip so users see *which year's number they're being evaluated against*.
- **P2** "Cliff curve" library — for programs with phaseouts (Section 8, premium tax credit), model the slope, not a single line.

---

## 4. Forecasting & trend detection (deterministic only)

**Current state.** `projectRecurringEarnedRestOfMonthCents` walks confirmed earned_income recurring streams and adds expected occurrences through month-end. That's the entire forecast. There is no:
- multi-month trajectory
- annual / year-to-date projection (despite `annual_income` thresholdType)
- asset-balance forecast (only sums today's max)
- variance / confidence band
- trend detection on `unearned_income` or expense outflow
- anomaly detection on transactions

**Gaps.**
- **P0** Implement annual_income forecast: YTD earned + YTD unearned + projected remaining months from recurring inflows. Needed for SNAP gross-income windows, Section 8 recerts, ABLE contribution caps.
- **P0** Asset balance projection: roll forward last 60 days of net daily flow on the depository accounts to estimate when SSI $2,000 cap would be breached. This is the *highest-stakes* alert for SSI beneficiaries — easy to breach with a single tax refund.
- **P0** Confidence band on the projection line (min/avg/max occurrences observed in last 90 days), surfaced as a shaded area on the chart.
- **P1** Likelihood/percentile scoring: instead of a binary "breach" prediction, output "78% chance you exceed $2,000 before month end" using the empirical distribution of past month-end balances or a simple bootstrap.
- **P1** "Cliff countdown" widget — days until the projected breach line crosses the threshold, like a Robinhood loss/gain countdown.
- **P1** Trend triggers on `Alert.trigger = 'trend'`: today the code path exists in `evaluate-thresholds.ts` but the only `trend` it fires is the static `warnAt` warning. Add real trend detection — 4-week increasing slope on asset balance, 3-week running income exceeding `0.7 × limit`, recurring stream amount drift (raise) > 10%.
- **P1** "What-if" simulator: user toggles "exclude this $500 deposit" and instantly sees how the threshold rows and chart shift. Pure client-side recompute since metrics are already pure functions.
- **P2** Seasonality on annual: e.g., Section 8 income certs care about prior 12 months — surface "if you keep this pace for 9 more months you cross AMI."

---

## 5. Alerts, notifications, and email delivery (critical gap)

**Current state.** Alerts are generated and stored. Users can ack/dismiss in the UI. **There is no email delivery code in the application.** Grep for `sendMail`, `nodemailer`, `resend`, `sendgrid`, `postmark` returns nothing outside `node_modules`. `Alert.emailSent` and `User.notificationPrefs.frequency` are set, but nothing reads them or calls a provider. No `lib/email/` folder exists. `RESEND_API_KEY` is in `.env.example` but never referenced.

**Gaps.**
- **P0** Wire Resend (or SES — abstract behind an `EmailProvider` interface as the spec calls out). Implement at minimum: `alert-realtime`, `digest-daily`, `digest-weekly`, `welcome`, `plaid-reauth`. Use React Email or Maizzle.
- **P0** Background dispatch. Right now alerts are only ever created during `POST /api/plaid/sync` (i.e., when the user is on the page and clicks Sync). For beta you need:
  - Webhook from Plaid → trigger sync (today the receiver at `app/api/plaid/webhook/route.ts` only logs and returns 200; no work is enqueued).
  - A scheduled daily job to sync every active connection and run threshold evaluation.
  - Digest jobs at user-local 8am for "daily" and Monday 8am for "weekly".
- **P0** Pick a job runner and stand it up. `inngest` is referenced in env and spec but **not installed**. Either install `inngest` or use Vercel Cron + a signed internal endpoint. Without this, beta users won't be alerted unless they manually visit the app.
- **P0** Real email verification. `app/auth/verify/page.tsx` exists but the credentials flow never sends a verification email and `emailVerified` stays null. For a benefits-monitoring app this is a credibility issue.
- **P0** Plaid `ITEM_LOGIN_REQUIRED` reauth flow + email. The webhook handler ignores this event. When a bank disconnects, you currently go silently dark — *worse than no app*, because users believe they're being monitored.
- **P1** Per-threshold mute / snooze. "I already know I'll hit this; don't alert until next month."
- **P1** In-app realtime alerts on dashboard (browser notification + a header bell counter that's actually live — today it's a static icon).
- **P1** SMS as an upgrade — defer to v2 per the spec, but make the `NotificationPreferences` model future-proof.
- **P2** Quiet hours, time-zone-aware delivery.

---

## 6. Family / caregiver / agency shared access (missing)

This is the entire reason for the four account types, and it's not implemented.

**Current state.** `User.accountType` exists with the four values. `Beneficiary.ownerUserId` is a single ObjectId — **no shared access list, no invite mechanism, no roles**. `assertBeneficiaryAccess` only checks `ownerUserId === session.user.id`. So a fiduciary or nonprofit can't actually invite other staff onto a case, a parent can't add the beneficiary themselves with view-only access, and an agency caseworker can't hand a case off. There's no `/admin/caseload`, no invite endpoint, no permissions matrix.

**Gaps.**
- **P0** `BeneficiaryAccess` collection: `{ beneficiaryId, userId, role: 'owner' | 'co_manager' | 'viewer', invitedByUserId, invitedAt, acceptedAt, status: 'pending' | 'active' | 'revoked' }`. Migrate `ownerUserId` into one row of this collection.
- **P0** Rewrite `assertBeneficiaryAccess` to consult `BeneficiaryAccess`. Add `requireRole(beneficiaryId, minRole)` helper for write paths.
- **P0** Invite flow: `POST /api/beneficiaries/:id/invites` → emails a one-time accept link → recipient signs up or signs in → row flipped to active. The beneficiary themselves should also be invitable so they can see what their guardian sees (very common ask).
- **P0** Settings page tab "Sharing" — list current people with access, role chip, remove button. Audit-logged.
- **P0** Account-type UI gates: fiduciary/nonprofit dashboards should default to a *caseload* view (list of all beneficiaries with status pills + the worst-trending one on top), not the single-beneficiary dashboard.
- **P1** Read-only mode for `viewer` role — hide all PATCH/DELETE buttons in components. Today the components don't even know the role.
- **P1** Caseload bulk actions for nonprofits: "Sync all", "Export all monthly summaries", "Show me everyone in 'watch' or 'concern' state".
- **P1** Per-beneficiary visibility scopes for non-profits: maybe they should *not* see vault contents, only metadata, depending on consent. Add a `consentScope` field on `BeneficiaryAccess`.
- **P2** Activity log filter "who else viewed my data this month" for the beneficiary's own peace of mind.

---

## 7. Plaid integration hardening

**Current state.** Sandbox-configured, client builder in `lib/plaid/server.ts`, encryption in `lib/plaid/crypto.ts`. Sync works on click. Webhook receiver returns 200 and logs. Recurring sync wrapped in try/catch — silent in sandbox if fixture missing.

**Gaps.**
- **P0** Webhook signature verification (JWT/JWKS) — currently TODO in `app/api/plaid/webhook/route.ts`.
- **P0** Webhook → enqueue sync job (per the job runner you pick in §5).
- **P0** Handle `ITEM_LOGIN_REQUIRED`, `PENDING_EXPIRATION`, `USER_PERMISSION_REVOKED` — set `BankConnection.status`, email user.
- **P0** Move from `PLAID_ENV=sandbox` to development for the beta; document encryption-key rotation procedure (the spec calls for annual rotation; nothing handles re-encryption).
- **P1** Surface partial-sync errors per connection in `/accounts` — currently `status` and `lastSyncAt` are shown but per-account errors are not.
- **P1** "Excludable accounts" UI (see §2): mark a savings account as not-counted-toward-asset-threshold.
- **P1** Investment / brokerage accounts (currently only `type === 'depository'` minus credit is counted by `maxCheckingSavingsBalanceCents`). SSI counts most brokerage assets too.

---

## 8. Vault, exports, advisor, admin (each partial)

**Vault (P1).** Schema, upload, list, download row exist; storage backend is unclear (no GCS code path observed in `lib/`, despite the spec). Confirm where files actually land — `/api/vault/upload` may currently be storing locally or in Mongo blob. Add: virus-scan job, GCS signed URLs with short TTL, expiration, audit logging on every download, mime-type/size enforcement on the server (not just client).

**Exports (P1).** `generateExport` works for CSV and JSON, **throws** for PDF and ZIP. ZIP bundles and PDF reports are explicitly promised on the `/reports` page ("Generate CSV, PDF, JSON, or ZIP bundles…"). Either implement them (`@react-pdf/renderer` + `archiver`) or hide the radio options until they exist. Fiduciary report (`fiduciary_report`) is not in the dataset enum at all.

**Advisor (P1).** Single-shot non-streaming call to Anthropic. No persistent `aiChatSessions` / `aiChatMessages` collections even though the spec defines them. No safety classifier on user input. No beneficiary context (the user's actual programs, current threshold statuses) is injected — so it can only answer generically. Should: stream via SSE; persist sessions; inject a redacted summary of "user enrolled in [SSI, SNAP]; closest threshold is [SSI resource] at 87% of limit"; flag self-harm/crisis language.

**Admin (P0 for beta).** `/admin/thresholds` and `/admin/users` are list-only stubs. For beta you need at minimum: CRUD on thresholds, ability to look at a flagged advisor session, ability to disable a user, and a per-environment "seed thresholds for next year" button.

---

## 9. Onboarding flow gaps

- **P0** Onboarding for `family`/`fiduciary`/`nonprofit` accounts is missing the "add the first beneficiary you manage" step (`/onboarding/beneficiary` exists but the routing assumes one beneficiary == owner). The form currently writes to a single owner-beneficiary; a fiduciary needs to add a *separate* managed person.
- **P0** Capture `householdSize` and `state` early — they gate which thresholds apply. Already in profile step but only one beneficiary's worth.
- **P1** Onboarding "explain what we don't do" disclaimer card, signed and timestamped, before Plaid link. Compliance ask.
- **P1** Progressive program metadata: when user picks SNAP, ask household size; when they pick Section 8, ask AMI county; when ABLE, ask if they're ABLE-to-Work. Today `Beneficiary.benefitsEnrolled[].contextData` is `Mixed` and unused.
- **P2** Sample data / "demo beneficiary" toggle so caseworkers can try the product without linking a real bank.

---

## 10. Security, privacy, and compliance

- **P0** Rate limiting on `/api/auth/register`, `/api/auth/[...nextauth]`, `/api/advisor`, `/api/plaid/*`. Nothing in middleware.ts caps abuse.
- **P0** Password reset flow. Not present.
- **P0** "Delete my account" hard-delete path — required for state privacy laws and for beta users who change their mind. Includes revoking Plaid items via API.
- **P0** Sentry or equivalent — no error monitoring is wired. For beta you cannot debug user reports without it.
- **P1** 2FA / TOTP. Spec defers to post-launch but for fiduciaries handling multiple clients you may want it sooner.
- **P1** Session fingerprinting + "new device" email (security activity).
- **P1** Activity log retention/archival job per spec (7-year retention, GCS Nearline after 1y).
- **P1** Legal review of disclaimer copy on every page that surfaces a number. The current language is good ("informational only — confirm with SSA") but it's inconsistent across pages — extract to a shared component.
- **P2** SOC 2 prep (post-beta).

---

## 11. Mobile / accessibility / polish

- **P1** Several tables have `min-w-[640px]`/`[720px]` which break on phones. Mobile users are a large share of the beneficiary population; collapse rows to cards on `<sm`.
- **P1** Keyboard focus rings are missing on the toolbar buttons (they're `Link` styled as buttons; `:focus-visible` ring needed).
- **P1** Color contrast on the status pills (`#fff4ce` + `#797673` = unclear chip) does not meet WCAG AA.
- **P1** Skeleton loaders instead of the "Loading…" text on every page.
- **P1** Empty-state illustrations (or at least friendlier copy with a primary CTA). Helps people who land on the dashboard before they've connected anything.
- **P2** Internationalized number/date formatting (use `Intl` consistently — `formatShortDate` is custom).
- **P2** Print stylesheet for `/thresholds` and `/reports` — caseworkers print.

---

## 12. QA, observability, and beta-ops

- **P0** Seed data + Plaid sandbox fixture script (`scripts/seed-thresholds.ts`, `scripts/seed-demo-user.ts`). The single existing script is just `plaid-ping.cjs`.
- **P0** End-to-end Playwright tests for the four "happy paths" each persona will hit:
  1. Beneficiary signs up → links sandbox bank → categorizes a payroll → sees a watch alert.
  2. Family member adds a beneficiary → invites them → both see the dashboard.
  3. Fiduciary imports two beneficiaries → exports a bundle.
  4. Beneficiary excludes a one-off deposit → watch state clears.
- **P0** Unit-test backfill for the modules called out as highest-stakes by the spec: `lib/thresholds/metrics.ts` (good — 54 lines of tests exist), but `evaluate-thresholds.ts` and the new rules engine have none.
- **P1** Sentry breadcrumbs around every Plaid call (status, request_id) — Plaid issues are the #1 thing you'll be debugging.
- **P1** Status page / health endpoint (`/api/health` that pings Mongo + Plaid + Resend).
- **P1** Feature flag system (even just env-driven) so you can dark-launch the chart, rules engine, sharing.
- **P2** In-app feedback button → emails support inbox. Beta users need a frictionless way to report bugs.

---

## 13. Domain content that doesn't fit any category but matters

- **P1** State-by-state resource center. `/resources/page.tsx` exists; verify it's populated. Beneficiaries lean on this when they don't trust the dashboard.
- **P1** "How is this number computed?" disclosure for every threshold row — link to a short page that shows the formula and the contributing transactions (not just the source URL).
- **P1** Plain-language glossary (SGA, FBR, AMI, MAPR, MAGI vs non-MAGI Medicaid). One tooltip per acronym.
- **P2** Reminders calendar — SSI redeterminations, SNAP recerts, Section 8 income review dates — driven off `Beneficiary.benefitsEnrolled[].contextData.enrolledSince` + program rules.

---

## Suggested 4-sprint plan to reach beta

**Sprint 1 — Foundations of trust:** rules engine + excludable transactions (§2), real email delivery + Plaid webhook handling (§5), shared access model (§6). Without these three, beta users get bad alerts, miss alerts, and can't collaborate.

**Sprint 2 — Make it look like the pitch:** Recharts integration, hero sparkline, time-range toggle, threshold row sparklines, what-if simulator (§1, §4).

**Sprint 3 — Library + admin + onboarding:** all federal threshold seeds + top-10-state Medicaid + admin CRUD + annual versioning + per-program onboarding metadata (§3, §9).

**Sprint 4 — Beta-ops + polish:** rate limiting, Sentry, account deletion, mobile responsive, seed/demo data, Playwright happy paths, status page, feedback button (§10–12). Then invite the first 10–20 households.

---

## What's already strong (don't redo)

- `lib/thresholds/metrics.ts` math and unit tests
- `lib/thresholds/evaluate-thresholds.ts` de-dup logic and snapshot capture
- Mongo schemas are very close to the spec — most additions above are *fields*, not rewrites
- Activity logging is consistently called from every mutation route
- The `(authenticated)` group layout + AppShell components are clean reusable primitives, easy to extend
- Plaid token AES-256-GCM encryption in `lib/plaid/crypto.ts`
- The advisor's `SYSTEM_PROMPT` is well-bounded for "no eligibility determinations"

Build on these — almost everything missing slots into the existing seams.

---

## Living tracker (implementation status)

Update this section as work lands. Full gap list remains in the sections above.

### Sprint 1 — foundations (partial)

- [x] **§1 P1** Dashboard uses `loadThresholdDashboardPayload` + live metrics (earned, assets, alerts count, bank count).
- [x] **§1 P0** Recharts installed; **Earned income this month** cumulative chart with limit / watch reference lines (UTC month, `earned_income` tags).
- [x] **§12 P1** `GET /api/health` — Mongo connectivity; **middleware** allows unauthenticated `/api/health`.
- [x] **§12 P0** `npm run plaid:ping` — verify Plaid keys from `.env` / `.env.local`.
- [x] **§2 P0** Transaction `excludedFromThresholds` (+ notes, stream/rule refs) + recurring stream exclude; metrics, chart series, evaluator, and dashboard skip excluded; Plaid sync preserves user fields via `$setOnInsert`; transactions/recurring UI toggles.
- [x] **§2 P0** `ClassificationRule` Mongoose model (rule evaluation on sync / recategorize modal still TODO).
- [x] **§5 P0** Resend wired for new alerts (`RESEND_API_KEY` + optional `RESEND_FROM_EMAIL`); sent after Plaid sync and after beneficiary benefits PATCH when evaluation creates alerts.
- [x] **§5 P0** Plaid **TRANSACTIONS** webhooks run incremental sync for the matching item (plus **ITEM** status updates for login required / disconnected).
- [x] **§6 P0** `BeneficiaryAccess` collection + lazy owner row seeding; `assertBeneficiaryAccess` / **`assertBeneficiaryWriteAccess`** (viewers read-only on mutations). Invite flow still TODO.

### Sprint 2 — visualization & forecasting

- [ ] **§1 P1** `/api/transactions/series` + time-range toggle; threshold row sparklines.
- [ ] **§4 P0** Annual-income forecast, asset projection, confidence band.

### Sprint 3 — library & admin

- [ ] **§3 P0** Expanded federal/state threshold seeds + admin CRUD + COLA versioning.
- [ ] **§3 P0** Evaluator support for all `thresholdType`s (not only earned + assets).

### Sprint 4 — beta-ops

- [ ] **§10 P0** Rate limits, password reset, account delete + Plaid revoke, Sentry.
- [ ] **§12 P0** Playwright happy paths + more unit tests on `evaluate-thresholds`.
