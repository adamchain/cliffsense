# CliffSense MVP — Software Outline

A web application that helps benefits recipients (and those who manage benefits on their behalf) avoid losing means-tested government benefits by monitoring bank transactions against eligibility thresholds.

**Core loop:** Connect bank via Plaid → detect recurring income/deposits → compare against benefit-program thresholds → alert user via email before or when limits are breached.

---

## 0. Reference Folders (read these first)

Two folders live alongside this spec. Check them before writing meaningful UI or making product/architectural calls.

### `/mockups` — UI design reference (authoritative for look & feel)

Contains the approved screen designs in the Microsoft 365 / Fluent 2 visual style. **This is the source of truth for the UI.** Before building any page or component:

1. Look for a matching mockup file (e.g., `dashboard.html`, `signin.html`, `onboarding-plaid.html`, `transactions.html`).
2. Match the layout, spacing, typography scale, color usage, and component patterns shown.
3. Re-use the same primitives across pages — same top bar, same left rail, same toolbar treatment, same card style, same button styles, same form field treatment.

Design tokens to honor across the app:
- Brand blue: `#2b5797` (primary actions, top bar, links). Hover: `#1f4373`.
- Surface gray: `#faf9f8` (page bg). Card bg: `#fff`. Card border: `0.5px solid #edebe9`.
- Text: primary `#201f1e`, secondary `#605e5c`, muted `#a19f9d`.
- Semantic: success `#107c10`, warning `#ca5010`, danger `#a4262c`, info `#2b5797` — with light-tint backgrounds `#dff6dd`, `#fed9cc`, `#fde7e9`, `#deecf9`.
- Typography: `'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif`. Page title 20–24px / 500. Section heading 14px / 500. Body 13px. Meta 11–12px.
- Corner radius: 4px for most components (Fluent default), avoid heavy rounding.
- Borders are thin (0.5px) and grays are muted — never use heavy 1–2px borders or dark gray dividers.
- Toolbar above content: command-bar style with text + icon buttons, no large hero buttons inside content unless it's an empty state.
- Left rail: 56px wide icon-only nav with text labels under each icon, 2px left accent border for the active item.

If a mockup doesn't exist for a screen yet, derive the design from the closest existing mockup — never invent a new visual language. If the mockup and this spec disagree on UI, the mockup wins.

### `/reference-notes-and-info` — Background context (use only as needed)

Contains notes, sketches, and partial code from an older "Whiteboard" project that explored some of the same problem space. Treat this as background reading, not a direct reference:

- **Do** skim it once for context on the domain (benefit programs, threshold logic, user pain points) and to avoid repeating known dead ends.
- **Do** lift specific data — e.g., a state-by-state Medicaid limits table — if it's clearly accurate and current.
- **Don't** copy architectural patterns, file structure, naming, or code from it. That project's stack and decisions don't apply to this one.
- **Don't** assume anything in there is up to date. Verify any factual numbers (limits, COLAs, rule details) against an official source before using them.

If something in `reference-notes-and-info` contradicts this spec or the mockups, this spec and the mockups win.

---

## 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS | Server components for data, client for interactivity |
| Backend | Next.js API routes / Route Handlers | Monorepo for MVP; split later if needed |
| Database | MongoDB Atlas + Mongoose ODM | Document model fits the nested beneficiary/threshold data |
| Auth | NextAuth.js (Auth.js v5) | Email/password + magic link; sessions stored in Mongo |
| Bank data | Plaid (Transactions + Recurring Transactions products) | Sandbox → Development → Production |
| Email | Resend | 3,000 emails/mo free, then $20/mo for 50k |
| AI advisor | Anthropic Claude API (`claude-sonnet-4-20250514`) | Streaming responses; all chats logged for safety review |
| Background jobs | Inngest (free tier) | Daily transaction sync, alert evaluation, digest emails |
| Hosting | Vercel | Native Next.js fit |
| File storage | Google Cloud Storage (GCS) | User-uploaded documents (award letters, statements, IDs) — CMEK-encrypted bucket |
| Secrets / encryption | Vercel env vars; AES-256-GCM for Plaid access tokens at rest | Never store raw Plaid tokens unencrypted |
| Monitoring | Sentry (errors) + Vercel Analytics | Add Logflare/Axiom if needed |

---

## 2. User Account Types

Selected at sign-up; drives UI scoping and data access rules.

1. **Beneficiary** — manages their own benefits. One user = one beneficiary profile (themselves).
2. **Family member / caregiver** — manages benefits for one or more loved ones. One user = N beneficiary profiles.
3. **Professional fiduciary / trustee** — manages multiple clients (special needs trustees, elder law attorneys). One user = N client profiles. Sees reporting/export features.
4. **Nonprofit / caseworker** — manages a caseload. One user = N client profiles. Sees caseload management features.

Types 2–4 share the same underlying "managed beneficiary" data model. The difference is UI affordances and feature gating (e.g., bulk export is fiduciary/nonprofit only).

---

## 3. Data Model (MongoDB / Mongoose)

### `users`
```
{
  _id, email, hashedPassword, emailVerified,
  accountType: 'beneficiary' | 'family' | 'fiduciary' | 'nonprofit',
  name, createdAt, updatedAt, lastLoginAt,
  notificationPrefs: {
    frequency: 'realtime' | 'daily' | 'weekly',
    alertTypes: { predictive: bool, breach: bool, trend: bool },
    email: string  // can differ from login email
  },
  isAdmin: bool
}
```

### `beneficiaries`
```
{
  _id, ownerUserId (ref users),
  isOwner: bool,  // true if user is managing themselves
  firstName, lastName, dateOfBirth,
  state, county, householdSize,
  benefitsEnrolled: [{
    program: 'SSI' | 'SSDI' | 'SNAP' | 'Medicaid' | 'Section8' | 'TANF' | 'WIC' | 'LIHEAP' | 'ACA' | 'VA' | 'ABLE',
    enrolledSince: Date,
    contextData: { /* program-specific: e.g. SNAP householdSize, Medicaid category */ }
  }],
  createdAt, updatedAt
}
```

### `bankConnections`
```
{
  _id, beneficiaryId (ref beneficiaries),
  plaidItemId, plaidAccessTokenEncrypted, plaidInstitutionId, institutionName,
  accounts: [{
    plaidAccountId, name, mask, type, subtype, currentBalance, availableBalance
  }],
  status: 'active' | 'login_required' | 'error' | 'disconnected',
  lastSyncAt, cursor (for Plaid /transactions/sync),
  createdAt, updatedAt
}
```

### `transactions`
```
{
  _id, beneficiaryId, bankConnectionId, plaidTransactionId,
  date, postedDate, amount, currency,
  name, merchantName, category, plaidCategory,
  pending: bool,
  userCategory: 'earned_income' | 'benefit_deposit' | 'other_income' | 'expense' | 'transfer' | 'unclear',
  recurringStreamId (ref recurringStreams, optional),
  createdAt
}
```

### `recurringStreams`
```
{
  _id, beneficiaryId, plaidStreamId,
  description, merchantName,
  type: 'inflow' | 'outflow',
  averageAmount, lastAmount, frequency: 'weekly' | 'biweekly' | 'monthly' | 'semimonthly',
  status: 'mature' | 'early_detection',
  userCategory: 'earned_income' | 'benefit_deposit' | 'other_income' | 'subscription' | 'rent' | 'other',
  isConfirmed: bool,  // user has reviewed
  firstDate, lastDate, predictedNextDate, predictedNextAmount,
  createdAt, updatedAt
}
```

### `thresholds`
```
{
  _id,
  scope: 'system' | 'user',  // system = admin hard-coded, user = custom
  ownerId,  // userId if user-scoped, null if system
  beneficiaryId,  // null if system (applies to all enrolled in program)
  program,  // 'SSI', 'SNAP', etc., or null for custom
  state,  // null for federal/custom
  thresholdType: 'monthly_earned_income' | 'monthly_unearned_income' |
                 'annual_income' | 'asset_balance' | 'transaction_amount' | 'custom',
  limit: Number,
  comparison: 'lte' | 'lt' | 'gte' | 'gt',
  warnAtPercent: Number,  // e.g. 0.85 = warn at 85% of limit
  effectiveFrom, effectiveTo,
  label, description, sourceUrl,  // for transparency
  createdAt, updatedAt
}
```

### `alerts`
```
{
  _id, beneficiaryId, userId (who gets notified),
  thresholdId, level: 'info' | 'warning' | 'breach',
  trigger: 'predictive' | 'breach' | 'trend',
  message, dataSnapshot: { /* relevant numbers at time of alert */ },
  status: 'new' | 'acknowledged' | 'resolved' | 'dismissed',
  emailSent: bool, emailSentAt,
  createdAt, acknowledgedAt
}
```

### `aiChatSessions` / `aiChatMessages`
```
sessions: { _id, userId, beneficiaryId, startedAt, endedAt, flagged }
messages: { _id, sessionId, role: 'user' | 'assistant', content, createdAt, tokensUsed }
```

### `activityLogs` (formerly auditLogs — now a first-class feature)
```
{
  _id, userId (actor), beneficiaryId (subject, optional), sessionId,
  category: 'auth' | 'account' | 'beneficiary' | 'bank' | 'transaction' |
            'threshold' | 'alert' | 'vault' | 'advisor' | 'export' | 'admin',
  action: String,  // e.g. 'login', 'plaid.connected', 'threshold.created',
                   // 'alert.acknowledged', 'vault.downloaded', 'beneficiary.updated'
  resourceType, resourceId,  // what was acted upon
  details: { /* before/after snapshot for mutations, params for reads */ },
  ipAddress, userAgent, geoCountry, geoRegion,
  severity: 'info' | 'warning' | 'security',
  createdAt
}
```
Indexes: `{ userId, createdAt }`, `{ beneficiaryId, createdAt }`, `{ category, createdAt }`

### `exports` (any user can export their own data; fiduciaries can export across managed beneficiaries)
```
{
  _id, userId, beneficiaryIds: [ObjectId],
  exportType: 'transactions' | 'alerts' | 'recurring_streams' | 'thresholds' |
              'activity_log' | 'vault_index' | 'full_summary' | 'fiduciary_report',
  format: 'csv' | 'pdf' | 'json' | 'zip',  // zip = bundle of multiple types
  dateRange: { from, to },
  filters: { /* exportType-specific filters */ },
  status: 'queued' | 'processing' | 'ready' | 'failed' | 'expired',
  gcsBucket, gcsObjectPath, sizeBytes,
  signedUrlExpiresAt, downloadCount,
  errorMessage, createdAt, completedAt
}
```

### `fileVaultItems`
```
{
  _id, beneficiaryId (ref beneficiaries), uploadedByUserId (ref users),
  category: 'award_letter' | 'eligibility_notice' | 'denial_notice' | 'redetermination' |
            'bank_statement' | 'pay_stub' | 'tax_document' | 'id_document' |
            'medical' | 'correspondence' | 'trust_document' | 'other',
  programTag: 'SSI' | 'SSDI' | 'SNAP' | 'Medicaid' | 'Section8' | 'TANF' | 'WIC' |
              'LIHEAP' | 'ACA' | 'VA' | 'ABLE' | null,
  title, description, documentDate,  // date on the document itself
  // Storage
  gcsBucket, gcsObjectPath,  // gs://bucket/beneficiaries/{id}/{uuid}-{filename}
  mimeType, sizeBytes, sha256Hash,
  // Lifecycle
  status: 'uploading' | 'available' | 'quarantined' | 'deleted',
  virusScanStatus: 'pending' | 'clean' | 'infected' | 'error',
  virusScanAt,
  // Access
  tags: [String],
  expiresAt,  // optional auto-delete date (e.g. ID docs after verification)
  createdAt, updatedAt
}
```

---

## 4. Application Routes / Pages

```
/                           Landing page
/auth/signup                Sign-up (with account type selection)
/auth/signin
/auth/verify
/onboarding/profile         Name, state, household
/onboarding/beneficiary     For types 2–4: add first client/loved one
/onboarding/plaid           Connect bank via Plaid Link
/onboarding/benefits        Select programs enrolled in
/onboarding/notifications   Set email + frequency

/dashboard                  Overview: alerts, balances, recent activity, threshold status
/beneficiaries              (types 2–4) List of managed people
/beneficiaries/[id]         Detail view of one beneficiary

/accounts                   Connected bank accounts; reconnect/remove
/transactions               List with filters; categorize manually
/recurring                  Detected recurring streams; confirm/recategorize
/thresholds                 Active thresholds (system + custom); add/edit custom
/alerts                     History; acknowledge/dismiss
/advisor                    AI chat widget (full-page version)
/resources                  Federal/state/local links, filtered by state
/reports                    Exports — transactions, alerts, vault, fiduciary reports
/activity                   Activity log — view, filter, export own activity
/vault                      File vault — list, upload, organize documents
/vault/[id]                 Single document detail / preview
/settings                   Profile, notification prefs, beneficiary management

/admin                      (isAdmin only)
/admin/thresholds           CRUD system thresholds
/admin/users                User management
/admin/alerts               Cross-user alert monitoring
/admin/activity             Platform-wide activity log (security review)
/admin/ai-logs              Review flagged AI conversations
```

---

## 5. API Routes

```
POST   /api/auth/*                          NextAuth handlers

POST   /api/plaid/link-token                Create Plaid Link token
POST   /api/plaid/exchange                  Exchange public_token for access_token
POST   /api/plaid/webhook                   Plaid webhook receiver
DELETE /api/plaid/items/:id                 Disconnect a bank

GET    /api/beneficiaries
POST   /api/beneficiaries
GET    /api/beneficiaries/:id
PATCH  /api/beneficiaries/:id
DELETE /api/beneficiaries/:id

GET    /api/transactions?beneficiaryId=&from=&to=
PATCH  /api/transactions/:id                User recategorize

GET    /api/recurring?beneficiaryId=
PATCH  /api/recurring/:id                   Confirm/recategorize stream

GET    /api/thresholds?beneficiaryId=
POST   /api/thresholds                      Create custom threshold
PATCH  /api/thresholds/:id
DELETE /api/thresholds/:id

GET    /api/alerts?beneficiaryId=&status=
PATCH  /api/alerts/:id                      Acknowledge/dismiss

POST   /api/advisor/chat                    Streaming SSE
GET    /api/advisor/sessions

GET    /api/reports                         List my exports
POST   /api/reports                         Create new export (any type)
GET    /api/reports/:id                     Export status
GET    /api/reports/:id/download            Get signed URL for ready export
DELETE /api/reports/:id                     Remove export

GET    /api/activity?beneficiaryId=&category=&from=&to=    Filterable activity log
POST   /api/activity/export                 Trigger CSV/PDF export of activity log

GET    /api/vault?beneficiaryId=&category=&program=
POST   /api/vault/upload-url                Get GCS signed PUT URL for direct upload
POST   /api/vault                           Finalize upload — create metadata record
GET    /api/vault/:id                       Get metadata
GET    /api/vault/:id/download              Get short-lived GCS signed GET URL
PATCH  /api/vault/:id                       Update title/category/tags
DELETE /api/vault/:id                       Soft delete + remove from GCS

POST   /api/admin/thresholds                Admin CRUD
PATCH  /api/admin/thresholds/:id
DELETE /api/admin/thresholds/:id

POST   /api/jobs/sync-transactions          Internal — Inngest trigger
POST   /api/jobs/evaluate-thresholds        Internal — Inngest trigger
POST   /api/jobs/send-digest                Internal — Inngest trigger
```

---

## 6. Key Workflows

### 6.1 Sign-up & onboarding
1. User picks account type → creates account → verifies email
2. Profile basics (name, state)
3. If type ≠ beneficiary: add first managed person
4. Plaid Link flow → exchange public_token → encrypt and store access_token → fetch initial transactions (24 months)
5. Select benefits enrolled in → system thresholds auto-attach
6. Set notification frequency → land on dashboard

### 6.2 Transaction sync (daily, via Inngest)
1. For each active `bankConnection`, call Plaid `/transactions/sync` with stored cursor
2. Upsert added/modified transactions; mark removed
3. Update `cursor` and `lastSyncAt`
4. Call `/transactions/recurring/get` (weekly cadence is enough — it's expensive)
5. Upsert `recurringStreams`
6. Auto-categorize recurring streams via heuristic (matches "SSA", "SSI" → benefit_deposit; payroll keywords → earned_income; unclear → unclear)
7. Trigger threshold evaluation for affected beneficiaries

### 6.3 Threshold evaluation
1. Load all thresholds applicable to beneficiary (system thresholds matching their `benefitsEnrolled` + their custom thresholds)
2. For each threshold, compute current state:
   - `monthly_earned_income`: sum of confirmed earned_income transactions/streams this calendar month + projected to month-end based on recurring streams
   - `asset_balance`: max balance across non-excluded accounts
   - `annual_income`: year-to-date + projected to year-end
3. Compare to `limit`:
   - `currentValue >= limit` → breach alert
   - `projectedValue >= limit` → predictive alert
   - `currentValue >= limit × warnAtPercent` → warning alert
4. De-duplicate: don't re-fire same alert if active one exists in last 7 days unless severity escalated
5. Insert `alerts` documents
6. Queue email notification per user's prefs

### 6.4 Email notifications (Resend)
- Realtime: send immediately on alert creation
- Daily: 8am user-local digest job rolls up the day's alerts
- Weekly: Monday 8am digest
- Templates: `alert-realtime`, `digest-daily`, `digest-weekly`, `welcome`, `plaid-reauth`, `weekly-summary`
- Abstract via `EmailProvider` interface so AWS SES can be swapped in later without code changes

### 6.5 AI advisor chat
- POST `/api/advisor/chat` with message history + beneficiary context
- System prompt: "You are CliffSense's informational assistant. You provide general information about US benefits programs and how they relate to the user's situation. You are NOT a lawyer, financial advisor, or benefits counselor. Never tell a user definitively whether they will or will not lose benefits. Always recommend contacting a qualified benefits counselor, SSA office, or legal aid organization for binding decisions. If asked something outside scope, politely redirect."
- Stream response back via SSE
- Persist messages
- Run a lightweight safety classifier on user message; if it indicates crisis (financial despair, self-harm, etc.), inject a resource block in the response and flag the session
- Hard disclaimer rendered above the chat at all times

### 6.6 Exports (transactions, alerts, activity, fiduciary reports)

**Available to all account types** (beneficiary, family, fiduciary, nonprofit) — scope of what they can export depends on which beneficiaries they have access to.

- User selects export type, beneficiary scope, date range, format, and any type-specific filters
- Request creates `exports` record with `status: 'queued'`
- Inngest job (`generate-export`) picks it up:
  1. Streams matching records from Mongo (use cursor — exports can be large)
  2. **CSV**: writes columns directly to a `Writable` stream piped to GCS upload
  3. **PDF**: renders with `@react-pdf/renderer`, includes header (beneficiary, date range, generated-at), tables, threshold-status summary
  4. **JSON**: raw structured dump for power users / API integrations later
  5. **ZIP**: bundle (e.g., full account snapshot = transactions.csv + alerts.csv + vault-index.csv + activity.csv)
- Upload to `gs://cliffsense-exports/{userId}/{exportId}.{ext}` with v4 signed URL valid for 7 days
- Email user when ready: "Your export is ready" with link to download
- Log to `activityLogs` (category: `export`, action: `export.created` / `export.downloaded`)

**Export types**:

| Type | Scope | Formats | Who can export |
|---|---|---|---|
| transactions | per beneficiary, date range | csv, pdf, json | any user with access |
| alerts | per beneficiary, date range, status filter | csv, pdf, json | any user |
| recurring_streams | per beneficiary | csv, json | any user |
| thresholds | per beneficiary | csv, pdf | any user |
| activity_log | per user or per beneficiary, date range | csv, pdf | own activity always; others' if has access |
| vault_index | per beneficiary | csv, pdf | any user with access (index only, not the files themselves) |
| full_summary | per beneficiary | pdf, zip | any user — comprehensive snapshot |
| fiduciary_report | one or more beneficiaries | pdf | fiduciary, nonprofit — formatted for trust accounting / audit |

### 6.7 Activity logging

**What gets logged** (write to `activityLogs` on every action):

- **Auth**: `login`, `login.failed`, `logout`, `password.changed`, `mfa.enabled`, `account.created`
- **Account**: `profile.updated`, `notification_prefs.updated`, `account.deleted`
- **Beneficiary**: `beneficiary.created`, `beneficiary.updated`, `beneficiary.viewed`, `beneficiary.deleted`
- **Bank**: `plaid.linked`, `plaid.reauth_required`, `plaid.disconnected`, `transaction.synced`
- **Transaction**: `transaction.recategorized`
- **Recurring**: `recurring.confirmed`, `recurring.recategorized`
- **Threshold**: `threshold.created`, `threshold.updated`, `threshold.deleted` (custom only)
- **Alert**: `alert.created` (system), `alert.acknowledged`, `alert.dismissed`, `alert.email_sent`
- **Vault**: `vault.uploaded`, `vault.viewed`, `vault.downloaded`, `vault.updated`, `vault.deleted`
- **Advisor**: `advisor.session_started`, `advisor.message_flagged`
- **Export**: `export.created`, `export.downloaded`
- **Admin**: `admin.threshold_updated`, `admin.user_modified`, `admin.flagged_session_reviewed`

**Activity log UI** (`/activity`):
- Filterable by category, date range, beneficiary (for types 2–4), action
- Each row: timestamp, actor, beneficiary subject, action, details summary
- Click row → expanded detail with full `details` object
- Export button → uses the standard exports pipeline above

**Retention**: 7 years (typical fiduciary requirement). Compress and move to GCS Nearline after 1 year to reduce Mongo storage cost.

**Security activity** (severity: `security`):
- Failed logins (3+ in 1 hour triggers email to user)
- New device login (geo / user-agent fingerprint different from prior)
- Password changes
- Plaid token refresh/disconnect

### 6.8 File vault (document storage)
- **Upload flow (direct-to-GCS to avoid proxying large files through Vercel)**:
  1. Client requests `POST /api/vault/upload-url` with `{ filename, mimeType, sizeBytes, beneficiaryId, category }`
  2. Server validates: user has access to beneficiary, mime type is in allowlist (`application/pdf`, `image/jpeg`, `image/png`, `image/heic`, `image/webp`), size ≤ 25 MB
  3. Server generates a v4 signed PUT URL for `gs://cliffsense-vault/beneficiaries/{beneficiaryId}/{uuid}-{sanitizedFilename}` with 10-minute expiry and a content-type constraint
  4. Client `PUT`s file directly to GCS
  5. Client calls `POST /api/vault` with `{ gcsObjectPath, sizeBytes, sha256Hash, title, category, programTag, documentDate, description }`
  6. Server creates `fileVaultItems` record with `status: 'uploading'`, verifies the object exists in GCS, sets status to `available`
  7. Inngest job (`scan-uploaded-file`) runs ClamAV scan (via Cloud Run or Lambda function); updates `virusScanStatus`; if infected, moves to quarantine bucket and sets status to `quarantined`
- **Download flow**: `GET /api/vault/:id/download` checks access, returns v4 signed GET URL valid 5 minutes
- **Access rules**:
  - Beneficiary type: can access own vault items
  - Family/fiduciary/nonprofit: can access vault items for beneficiaries they own
  - All access logged to `auditLogs`
- **Storage layout**:
  - Bucket: `cliffsense-vault` (uniform bucket-level access, CMEK with Cloud KMS key, versioning on, public access prevention enforced)
  - Object path: `beneficiaries/{beneficiaryId}/{uuid}-{sanitized-filename}`
  - Lifecycle: objects with no corresponding active `fileVaultItems` record older than 24h → auto-delete (cleanup orphaned uploads)
  - Quarantine bucket: `cliffsense-vault-quarantine` (locked-down access)
  - Exports bucket: `cliffsense-exports` (7-day lifecycle delete)
- **Deletion**:
  - Soft delete: `fileVaultItems.status = 'deleted'`, GCS object retained 30 days in case of accident
  - Hard delete: Inngest job nightly purges soft-deleted objects past 30 days
  - Full account deletion: hard-delete all vault objects and metadata immediately
- **PDF preview in browser**: signed URL + iframe; for images, signed URL + `<img>`
- **Cost note**: GCS Standard for active vault, Nearline tier transition after 90 days idle to reduce cost

---

## 7. Plaid Integration Details

- **Products to enable**: `transactions`, `auth` (optional, for verifying account ownership), `recurring_transactions`
- **Webhook events to handle**:
  - `SYNC_UPDATES_AVAILABLE` → trigger `/api/jobs/sync-transactions`
  - `ITEM_LOGIN_REQUIRED` / `PENDING_EXPIRATION` → set `bankConnection.status` and email user
  - `RECURRING_TRANSACTIONS_UPDATE` → re-fetch recurring streams
- **Token security**: encrypt `access_token` with AES-256-GCM using a key in Vercel env (rotate annually); never log it
- **Sandbox testing**: use `user_good`/`pass_good` and custom recurring test fixtures
- **Cost note**: budget Plaid carefully — Recurring Transactions is a separate billed product; sync only weekly unless a webhook fires

---

## 8. Hard-Coded Threshold Seed Data (admin)

Seed these on first deploy. Admin dashboard lets you update annually when COLA / federal updates happen.

| Program | Threshold | Limit (2025) | Type | Notes |
|---|---|---|---|---|
| SSI | Federal benefit rate (individual) | $967/mo | unearned_income reference | |
| SSI | Resource limit (individual) | $2,000 | asset_balance | Critical — easy to breach |
| SSI | Resource limit (couple) | $3,000 | asset_balance | |
| SSI | SGA (non-blind) | $1,620/mo | monthly_earned_income | |
| SSI | SGA (blind) | $2,700/mo | monthly_earned_income | |
| SSI | Earned income exclusion | $65 + half remainder | calc rule | Computed, not threshold |
| SSDI | SGA (non-blind) | $1,620/mo | monthly_earned_income | |
| SSDI | TWP threshold | $1,160/mo | monthly_earned_income | Trial Work Period |
| SNAP | Gross income (HH=1) | $1,632/mo | monthly_gross_income | Scales by household size & state |
| SNAP | Net income (HH=1) | $1,255/mo | monthly_net_income | |
| Medicaid (non-MAGI) | Varies by state | state-specific | annual_income | Seed top 10 states first |
| Section 8 | 30% AMI / 50% AMI | HUD tables | annual_income | Pull HUD income limits API |
| ABLE | Annual contribution | $19,000 | annual_contribution | $19k + working ABLE-to-Work amount |

**Important:** these change annually. Build the admin UI to show `effectiveFrom`/`effectiveTo` and version old values rather than overwriting.

---

## 9. Security & Compliance Notes

- **Encryption at rest**: enable MongoDB Atlas encryption; encrypt Plaid tokens with app-layer AES-256-GCM
- **Encryption in transit**: HTTPS-only; HSTS
- **PII minimization**: only store the minimum needed; no SSN, no DOB beyond what's needed for benefit eligibility context
- **Activity log**: every read/write of beneficiary data, every auth event, every export, every vault access logged to `activityLogs`. Retained 7 years for fiduciary compliance.
- **Data deletion**: full "delete my account" path that removes user, beneficiaries, transactions, Plaid item revocation
- **Disclaimers**: legal review of (1) ToS, (2) AI advisor disclaimers, (3) alert email language — never use words like "guaranteed", "you will lose", "you are safe"
- **Future**: SOC 2 Type II once you have fiduciary/enterprise customers

---

## 10. Environment Variables

```
# Core
NEXTAUTH_URL=
NEXTAUTH_SECRET=
MONGODB_URI=

# Plaid
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox|development|production
PLAID_WEBHOOK_URL=
PLAID_ENCRYPTION_KEY=  # 32-byte base64

# Email
RESEND_API_KEY=
EMAIL_FROM=alerts@cliffsense.com

# AI
ANTHROPIC_API_KEY=

# Jobs
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Storage (Google Cloud Storage)
GCP_PROJECT_ID=
GCS_VAULT_BUCKET=cliffsense-vault
GCS_VAULT_QUARANTINE_BUCKET=cliffsense-vault-quarantine
GCS_EXPORTS_BUCKET=cliffsense-exports
GCS_SERVICE_ACCOUNT_KEY=  # JSON key, base64-encoded
GCS_KMS_KEY=              # full resource path for CMEK
GCS_SIGNED_URL_UPLOAD_TTL=600     # 10 min
GCS_SIGNED_URL_DOWNLOAD_TTL=300   # 5 min

# Monitoring
SENTRY_DSN=
```

---

## 11. Recommended File Structure

```
cliffsense/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── admin/
│   ├── api/
│   │   ├── auth/
│   │   ├── plaid/
│   │   ├── beneficiaries/
│   │   ├── transactions/
│   │   ├── recurring/
│   │   ├── thresholds/
│   │   ├── alerts/
│   │   ├── advisor/
│   │   ├── reports/
│   │   └── jobs/
│   └── layout.tsx
├── components/
│   ├── ui/                  # base components
│   ├── plaid/
│   ├── dashboard/
│   ├── alerts/
│   ├── advisor/
│   └── admin/
├── lib/
│   ├── db/                  # mongoose models + connection
│   ├── plaid/               # client + encryption + sync logic
│   ├── email/               # EmailProvider interface + Resend impl
│   ├── ai/                  # advisor prompts + safety
│   ├── thresholds/          # evaluation engine
│   ├── auth/                # nextauth config
│   ├── storage/             # GCS client, signed URLs, upload helpers
│   ├── activity/            # activity logger middleware + helpers
│   ├── exports/             # export generators (csv, pdf, zip)
│   └── utils/
├── inngest/                 # background job definitions
│   ├── sync-transactions.ts
│   ├── evaluate-thresholds.ts
│   ├── send-digest.ts
│   ├── scan-uploaded-file.ts
│   ├── generate-export.ts
│   └── purge-deleted-files.ts
├── scripts/
│   └── seed-thresholds.ts
├── emails/                  # React email templates
└── public/
```

---

## 12. Build Order (recommended for Claude Code)

**Before step 1:** Read `/mockups` and skim `/reference-notes-and-info` (see Section 0). The mockups define how every screen should look; the notes are background context only.

1. **Foundation**: Next.js scaffold, Mongo connection, NextAuth with account types, base UI components. Build the shared shell components first — top bar, left rail, toolbar, card, button, input, badge — to match the mockup design tokens exactly. Every later page reuses these.
2. **Activity logging infrastructure**: build this early — `activityLogs` model, a `logActivity()` helper, and middleware that auto-logs auth events. Every later step writes to it.
3. **Beneficiary model**: CRUD beneficiaries; types 2–4 onboarding to add managed people
4. **Plaid integration**: Link token, exchange, store encrypted, initial transaction sync, webhook receiver
5. **Transaction views**: list, filter, recategorize
6. **Recurring detection**: fetch from Plaid, surface in UI, allow confirm/recategorize
7. **Benefits selection**: UI to pick programs; associate with beneficiary
8. **Threshold engine**: seed system thresholds, build evaluation logic, run on transaction sync
9. **Alerts**: generation, dashboard display, acknowledge/dismiss
10. **Email notifications**: Resend integration, templates, frequency preferences
11. **Custom user thresholds**: UI to create/edit
12. **GCS storage layer**: signed URL helpers, bucket setup, CMEK config
13. **File vault**: upload flow, list/preview, download, virus scan job, soft-delete
14. **Exports**: build the `exports` pipeline once; generators for transactions / alerts / activity / vault index / fiduciary report
15. **Activity log UI**: `/activity` page with filters and the export action
16. **AI advisor**: chat UI, Anthropic streaming, safety prompts, logging
17. **Resources page**: static list filtered by state
18. **Admin dashboard**: threshold management, user oversight, activity review
19. **Polish**: empty states, error handling, loading states, disclaimers, mobile responsive
20. **Pre-launch**: legal review of disclaimers, security audit, beta with 10–20 real users

---

## 13. Out of Scope for v1 (Backlog)

- SMS / push notifications (everything is email)
- Mobile native apps (responsive web only)
- Multi-language support
- Document upload (award letters, eligibility notices)
- Direct integration with state benefits portals
- Team/collaboration features (multiple users per fiduciary org)
- Bulk operations for nonprofits (one beneficiary at a time for v1)
- OCR / automated benefit detection from deposits beyond keyword matching
- Tax integration
- Two-factor auth (add right after launch)

---

## 14. Notes for Claude Code

- Treat the threshold engine as the highest-stakes code — write it with unit tests covering each program's rule before wiring it into the UI
- All money values in cents (integers), never floats
- All dates as UTC in DB; convert to user-local for display only
- Plaid tokens never leave the server; never expose them to the client even encrypted
- The AI advisor must NEVER make eligibility determinations — prompt-test this aggressively
- Email copy needs to be calm and non-alarmist — these users are often stressed; avoid red colors and panic language
- **Always check `/mockups` first** before building any page or component. The visual style is Microsoft 365 / Fluent 2; do not improvise a different look.
- **Treat `/reference-notes-and-info` as background only.** Read it to understand the domain, but don't lift architecture, file structure, or code from it. Verify any numbers (benefit limits, etc.) against an official source.
- If a mockup is missing for a screen, follow the closest existing mockup's patterns rather than inventing a new style.