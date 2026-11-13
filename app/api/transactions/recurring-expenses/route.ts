import { auth } from "@/auth";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { assertBeneficiaryAccess } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import Transaction from "@/lib/db/models/Transaction";
import { summarizeExpenses, type ExpenseInput } from "@/lib/transactions/recurring-expenses";

const WINDOW_DAYS = 120;

function isoDaysAgo(days: number): string {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  utc.setUTCDate(utc.getUTCDate() - days);
  return utc.toISOString().slice(0, 10);
}

/** Repeating bills and the work-expense estimate for the Expenses view. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const beneficiaryId = new URL(req.url).searchParams.get("beneficiaryId");
  if (!beneficiaryId) {
    return NextResponse.json({ error: "beneficiaryId is required" }, { status: 400 });
  }
  const ok = await assertBeneficiaryAccess(session.user.id, beneficiaryId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const beneficiaryObjectId = new mongoose.Types.ObjectId(beneficiaryId);
  const [docs, ben] = await Promise.all([
    Transaction.find({
      beneficiaryId: beneficiaryObjectId,
      amountCents: { $gt: 0 },
      userCategory: "expense",
      pending: { $ne: true },
      excludedFromThresholds: { $ne: true },
      date: { $gte: isoDaysAgo(WINDOW_DAYS) },
    })
      .select({ date: 1, amountCents: 1, name: 1, merchantName: 1, category: 1 })
      .lean(),
    Beneficiary.findById(beneficiaryObjectId).select("irweSource").lean(),
  ]);

  const expenses: ExpenseInput[] = docs.map((row) => ({
    id: String(row._id),
    date: row.date,
    amountCents: row.amountCents,
    name: row.name ?? "",
    merchantName: row.merchantName ?? "",
    category: row.category ?? "",
  }));

  return NextResponse.json({
    ...summarizeExpenses(expenses),
    irweAuto: ben?.irweSource === "auto",
  });
}
