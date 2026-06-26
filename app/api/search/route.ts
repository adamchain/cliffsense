import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import { getPrimaryBeneficiaryForUser } from "@/lib/beneficiaries/access";
import Transaction from "@/lib/db/models/Transaction";
import RecurringStream from "@/lib/db/models/RecurringStream";
import Alert from "@/lib/db/models/Alert";
import Threshold from "@/lib/db/models/Threshold";
import { FORMS_CATALOG } from "@/lib/forms/catalog";

/* ---------------------------------------------------------------------------
 * Global search across the user's data + static destinations. Returns small,
 * grouped result sets for the topbar dropdown. When nothing matches, the client
 * offers to send the query to the AI advisor instead.
 * ------------------------------------------------------------------------- */

export type SearchItem = { label: string; sublabel?: string; href: string };
export type SearchGroup = { type: string; items: SearchItem[] };

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function usd(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// Static destinations searchable by keyword.
const PAGES: { label: string; href: string; keywords: string }[] = [
  { label: "Dashboard", href: "/dashboard", keywords: "home overview limits balances" },
  { label: "Banking / Transactions", href: "/transactions", keywords: "transactions banking deposits payments" },
  { label: "Recurring", href: "/recurring", keywords: "recurring streams subscriptions income" },
  { label: "Limits / Thresholds", href: "/thresholds", keywords: "limits thresholds eligibility" },
  { label: "Alerts", href: "/alerts", keywords: "alerts notifications warnings" },
  { label: "Reports & Docs", href: "/documents", keywords: "forms reports documents reporting recertification" },
  { label: "Exports", href: "/reports", keywords: "exports csv pdf download" },
  { label: "Vault", href: "/vault", keywords: "vault files documents storage" },
  { label: "Advisor", href: "/advisor", keywords: "advisor ai chat help questions" },
  { label: "Settings", href: "/settings", keywords: "settings account profile preferences" },
];

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ groups: [], total: 0 });
  }
  const rx = new RegExp(escapeRegex(q), "i");
  const groups: SearchGroup[] = [];

  // --- Static destinations (no DB) ---
  const pageItems: SearchItem[] = PAGES.filter((p) => rx.test(p.label) || rx.test(p.keywords))
    .slice(0, 5)
    .map((p) => ({ label: p.label, href: p.href }));
  if (pageItems.length) groups.push({ type: "Pages", items: pageItems });

  // --- Forms catalog (static) ---
  const formItems: SearchItem[] = FORMS_CATALOG.filter(
    (f) => rx.test(f.title) || rx.test(f.purpose) || (f.formNumber ? rx.test(f.formNumber) : false),
  )
    .slice(0, 5)
    .map((f) => ({
      label: f.formNumber ? `${f.formNumber} — ${f.title}` : f.title,
      sublabel: `${f.program} · ${f.agency}`,
      href: f.fillableId ? `/documents/${f.fillableId}` : "/documents",
    }));
  if (formItems.length) groups.push({ type: "Forms", items: formItems });

  // --- User data ---
  const primary = await getPrimaryBeneficiaryForUser(session.user.id);
  if (primary?._id) {
    await connectDB();
    const oid = primary._id;
    const [txs, streams, alerts, thresholds] = await Promise.all([
      Transaction.find({ beneficiaryId: oid, $or: [{ name: rx }, { merchantName: rx }] })
        .sort({ date: -1 })
        .limit(5)
        .select({ name: 1, merchantName: 1, amountCents: 1, date: 1 })
        .lean(),
      RecurringStream.find({ beneficiaryId: oid, $or: [{ description: rx }, { merchantName: rx }] })
        .limit(5)
        .select({ description: 1, merchantName: 1, averageAmountCents: 1 })
        .lean(),
      Alert.find({ beneficiaryId: oid, message: rx })
        .sort({ createdAt: -1 })
        .limit(5)
        .select({ message: 1, level: 1 })
        .lean(),
      Threshold.find({
        $and: [
          { label: rx },
          { $or: [{ scope: "system" }, { scope: "user", beneficiaryId: oid }] },
        ],
      })
        .limit(5)
        .select({ label: 1, program: 1 })
        .lean(),
    ]);

    const txItems = txs.map((t) => ({
      label: t.merchantName || t.name || "Transaction",
      sublabel: `${usd(t.amountCents)} · ${t.date}`,
      href: "/transactions",
    }));
    if (txItems.length) groups.push({ type: "Transactions", items: txItems });

    const streamItems = streams.map((s) => ({
      label: s.merchantName || s.description || "Recurring stream",
      sublabel: usd(s.averageAmountCents),
      href: "/recurring",
    }));
    if (streamItems.length) groups.push({ type: "Recurring", items: streamItems });

    const alertItems = alerts.map((a) => ({
      label: String(a.message ?? "").slice(0, 80),
      sublabel: String(a.level ?? ""),
      href: "/alerts",
    }));
    if (alertItems.length) groups.push({ type: "Alerts", items: alertItems });

    const thItems = thresholds.map((t) => ({
      label: String(t.label ?? "Limit"),
      sublabel: t.program ? String(t.program) : undefined,
      href: "/thresholds",
    }));
    if (thItems.length) groups.push({ type: "Limits", items: thItems });
  }

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return NextResponse.json({ groups, total });
}
