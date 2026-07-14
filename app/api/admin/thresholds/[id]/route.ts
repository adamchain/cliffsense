import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongodb";
import Threshold from "@/lib/db/models/Threshold";
import { ensureSystemThresholdsSeeded } from "@/lib/thresholds/ensure-system-thresholds";
import { clientMeta, getAdminSession, logAdminAction } from "@/lib/admin/audit";

const patchSchema = z
  .object({
    label: z.string().min(1).max(200).optional(),
    limitCents: z.number().int().positive().optional(),
    comparison: z.enum(["lte", "lt", "gte", "gt"]).optional(),
    warnAtPercent: z.number().min(0).max(1).optional(),
    program: z.string().max(40).optional().nullable(),
    state: z.string().max(2).optional().nullable(),
    description: z.string().max(2000).optional(),
    sourceUrl: z.string().max(500).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "No changes" });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await connectDB();
  const th = await Threshold.findById(id);
  if (!th || th.scope !== "system") {
    return NextResponse.json({ error: "System threshold not found" }, { status: 404 });
  }

  const d = parsed.data;
  if (d.label !== undefined) th.label = d.label.trim();
  if (d.limitCents !== undefined) th.limitCents = d.limitCents;
  if (d.comparison !== undefined) th.comparison = d.comparison;
  if (d.warnAtPercent !== undefined) th.warnAtPercent = d.warnAtPercent;
  if (d.program !== undefined) th.program = d.program?.trim() || null;
  if (d.state !== undefined) th.state = d.state?.trim() || null;
  if (d.description !== undefined) th.description = d.description.trim();
  if (d.sourceUrl !== undefined) th.sourceUrl = d.sourceUrl.trim();
  // Editing a bundled (keyed) row pins it against the reseeder. Custom rows
  // (no systemKey) are never reseeded, so the marker is harmless but unneeded.
  if (th.systemKey) th.overriddenByAdminAt = new Date();
  await th.save();

  await logAdminAction({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    action: "update_threshold",
    details: { thresholdId: id, label: th.label, fields: Object.keys(d) },
    ...clientMeta(req),
  });

  return NextResponse.json({ threshold: th });
}

/**
 * Clear a bundled row's admin override and let the seed value flow back in on
 * the spot. Only meaningful for keyed (bundled) rows.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  await connectDB();
  const th = await Threshold.findById(id);
  if (!th || th.scope !== "system") {
    return NextResponse.json({ error: "System threshold not found" }, { status: 404 });
  }
  if (!th.systemKey) {
    return NextResponse.json(
      { error: "Custom thresholds have no bundled default to reset to." },
      { status: 400 },
    );
  }

  th.overriddenByAdminAt = null;
  await th.save();
  // Re-apply the bundled seed values now that the override is cleared.
  await ensureSystemThresholdsSeeded();

  await logAdminAction({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    action: "reset_threshold",
    details: { thresholdId: id, systemKey: th.systemKey },
    ...clientMeta(req),
  });

  const fresh = await Threshold.findById(id).lean();
  return NextResponse.json({ threshold: fresh });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  await connectDB();
  const th = await Threshold.findById(id).lean();
  if (!th || th.scope !== "system") {
    return NextResponse.json({ error: "System threshold not found" }, { status: 404 });
  }

  await Threshold.deleteOne({ _id: id });

  await logAdminAction({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    action: "delete_threshold",
    details: { thresholdId: id, label: th.label, systemKey: th.systemKey },
    ...clientMeta(req),
  });

  return NextResponse.json({ ok: true, reseedable: Boolean(th.systemKey) });
}
