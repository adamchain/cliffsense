import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { assertBeneficiaryWriteAccess } from "@/lib/beneficiaries/access";
import { runBeneficiaryPlaidSync } from "@/lib/plaid/run-beneficiary-sync";

const bodySchema = z.object({
  beneficiaryId: z.string().min(1),
  bankConnectionId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { beneficiaryId, bankConnectionId } = parsed.data;
  const allowed = await assertBeneficiaryWriteAccess(session.user.id, beneficiaryId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const benObjectId = new mongoose.Types.ObjectId(beneficiaryId);
  const connId = bankConnectionId?.trim()
    ? new mongoose.Types.ObjectId(bankConnectionId)
    : undefined;

  const result = await runBeneficiaryPlaidSync({
    beneficiaryId: benObjectId,
    bankConnectionId: connId,
    actorUserId: session.user.id,
  });

  if (!result.ok) {
    const status = result.error === "No active bank connections" ? 404 : 503;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    connectionsSynced: result.connectionsSynced,
    transactionsUpserted: result.transactionsUpserted,
    recurringStreamsUpserted: result.recurringStreamsUpserted,
    recurringStreamsRemoved: result.recurringStreamsRemoved,
    alertsCreated: result.alertsCreated,
  });
}
