import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { logActivity } from "@/lib/activity/log-activity";

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  state: z.string().length(2).optional().or(z.literal("")),
  county: z.string().optional(),
  householdSize: z.coerce.number().min(1).optional(),
  isOwner: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const list = await Beneficiary.find({ ownerUserId: session.user.id })
    .sort({ updatedAt: -1 })
    .lean();
  return NextResponse.json({ beneficiaries: list });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  await connectDB();
  const { firstName, lastName, state, county, householdSize, isOwner } = parsed.data;
  const doc = await Beneficiary.create({
    ownerUserId: session.user.id,
    isOwner: isOwner ?? false,
    firstName,
    lastName,
    state: state?.toUpperCase() ?? "",
    county: county ?? "",
    householdSize: householdSize ?? 1,
  });
  await logActivity({
    userId: session.user.id,
    beneficiaryId: doc._id,
    category: "beneficiary",
    action: "beneficiary.created",
    resourceType: "beneficiary",
    resourceId: doc._id.toString(),
    details: { firstName, lastName },
  });
  return NextResponse.json({ beneficiary: doc });
}
