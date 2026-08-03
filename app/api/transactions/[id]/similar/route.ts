import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertBeneficiaryAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import Transaction from "@/lib/db/models/Transaction";
import {
  rowMatchesSimilar,
  similarMatchFrom,
  similarPrefilter,
} from "@/lib/transactions/similar";

const SCAN = 400;
const MAX = 100;

/**
 * List other transactions that look like this one (same merchant/name + bank)
 * and are not already on the given category — used to offer "apply to all".
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const userCategory = new URL(req.url).searchParams.get("userCategory");
  if (
    !userCategory ||
    ![
      "earned_income",
      "benefit_deposit",
      "other_income",
      "expense",
      "transfer",
      "unclear",
    ].includes(userCategory)
  ) {
    return NextResponse.json({ error: "userCategory is required" }, { status: 400 });
  }

  await connectDB();
  const tx = await Transaction.findById(id).lean();
  if (!tx) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ok = await assertBeneficiaryAccess(session.user.id, tx.beneficiaryId.toString());
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const match = similarMatchFrom(tx);
  if (!match) {
    return NextResponse.json({ match: null, count: 0, sample: [] });
  }

  const candidates = await Transaction.find({
    ...similarPrefilter(tx),
    _id: { $ne: tx._id },
    userCategory: { $ne: userCategory },
  })
    .sort({ date: -1 })
    .limit(SCAN)
    .select({ date: 1, name: 1, merchantName: 1, amountCents: 1, userCategory: 1 })
    .lean();

  const matched = candidates.filter((c) => rowMatchesSimilar(c, match)).slice(0, MAX);

  return NextResponse.json({
    match: {
      field: match.matchField,
      label: match.label,
    },
    count: matched.length,
    sample: matched.slice(0, 5).map((s) => ({
      _id: String(s._id),
      date: s.date,
      name: s.name,
      merchantName: s.merchantName,
      amountCents: s.amountCents,
      userCategory: s.userCategory,
    })),
  });
}
