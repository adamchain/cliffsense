import { NextResponse } from "next/server";
import type { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import BankConnection from "@/lib/db/models/BankConnection";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { isAuthorizedCronRequest } from "@/lib/cron/guard";
import { runBeneficiaryPlaidSync } from "@/lib/plaid/run-beneficiary-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Scheduled sync: walks every beneficiary with an active bank connection, runs
 * the Plaid sync + threshold evaluation (which dispatches realtime/breach
 * emails), and reports aggregate counts. Schedule daily via Vercel Cron.
 */
async function handle(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const beneficiaryIds = (await BankConnection.distinct("beneficiaryId", {
    status: "active",
  })) as Types.ObjectId[];

  let beneficiariesSynced = 0;
  let alertsCreated = 0;
  let failures = 0;

  for (const beneficiaryId of beneficiaryIds) {
    const ben = await Beneficiary.findById(beneficiaryId).select("ownerUserId").lean();
    const actorUserId = ben?.ownerUserId?.toString();
    if (!actorUserId) continue;
    try {
      const result = await runBeneficiaryPlaidSync({ beneficiaryId, actorUserId });
      if (result.ok) {
        beneficiariesSynced += 1;
        alertsCreated += result.alertsCreated;
      } else {
        failures += 1;
      }
    } catch (e) {
      console.warn("cron sync failed for beneficiary", String(beneficiaryId), e);
      failures += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    beneficiariesConsidered: beneficiaryIds.length,
    beneficiariesSynced,
    alertsCreated,
    failures,
  });
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  // Vercel Cron issues GET requests.
  return handle(req);
}
