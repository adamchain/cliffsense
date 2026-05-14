import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { assertBeneficiaryAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import Transaction from "@/lib/db/models/Transaction";
import mongoose from "mongoose";

const USER_CATEGORIES = [
  "earned_income",
  "benefit_deposit",
  "other_income",
  "expense",
  "transfer",
  "unclear",
] as const;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const beneficiaryId = searchParams.get("beneficiaryId");
  if (!beneficiaryId) {
    return NextResponse.json({ error: "beneficiaryId is required" }, { status: 400 });
  }
  const ok = await assertBeneficiaryAccess(session.user.id, beneficiaryId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const filter = searchParams.get("filter") ?? "all";
  const q = (searchParams.get("q") ?? "").trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));

  await connectDB();
  const beneficiaryObjectId = new mongoose.Types.ObjectId(beneficiaryId);

  const query: Record<string, unknown> = { beneficiaryId: beneficiaryObjectId };

  if (from || to) {
    const range: Record<string, string> = {};
    if (from) range.$gte = from;
    if (to) range.$lte = to;
    query.date = range;
  }

  if (filter === "inflow") {
    query.amountCents = { $lt: 0 };
  } else if (filter === "outflow") {
    query.amountCents = { $gt: 0 };
  } else if (filter === "unclear") {
    query.userCategory = "unclear";
  } else if ((USER_CATEGORIES as readonly string[]).includes(filter)) {
    query.userCategory = filter;
  }

  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    query.$or = [{ name: rx }, { merchantName: rx }, { category: rx }];
  }

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .sort({ date: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(query),
  ]);

  return NextResponse.json({
    transactions,
    total,
    page,
    limit,
  });
}
