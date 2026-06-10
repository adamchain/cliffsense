import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron/guard";
import { sendDigestForFrequency } from "@/lib/email/digest";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Scheduled digest: sends daily or weekly summary emails to users on that
 * cadence. Schedule `?frequency=daily` each morning and `?frequency=weekly`
 * weekly via Vercel Cron.
 */
async function handle(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const frequency = url.searchParams.get("frequency") === "weekly" ? "weekly" : "daily";
  const sent = await sendDigestForFrequency(frequency);
  return NextResponse.json({ ok: true, frequency, digestsSent: sent });
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}
