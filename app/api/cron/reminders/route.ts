import { NextResponse } from "next/server";
import { dispatchDueReminders } from "@/lib/tasks/dispatch-reminders";

export const dynamic = "force-dynamic";

/**
 * Sends due task/reminder emails. Call on a schedule (Vercel Cron, an external
 * uptime pinger, etc.). Protected by CRON_SECRET: send it as either
 * `Authorization: Bearer <secret>` or `?key=<secret>`. If CRON_SECRET is unset
 * the endpoint is disabled so it can never run unprotected in production.
 */
async function handle(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const url = new URL(req.url);
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const provided = bearer || url.searchParams.get("key")?.trim();
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sent = await dispatchDueReminders();
  return NextResponse.json({ ok: true, sent });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
