import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { logActivity } from "@/lib/activity/log-activity";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  state: z.string().length(2).optional(),
  householdSize: z.coerce.number().min(1).optional(),
  onboardingStep: z
    .enum(["none", "profile", "beneficiary", "plaid", "benefits", "notifications", "complete"])
    .optional(),
  notificationPrefs: z
    .object({
      frequency: z.enum(["realtime", "daily", "weekly"]).optional(),
      email: z.string().email().optional().or(z.literal("")),
      alertTypes: z
        .object({
          predictive: z.boolean().optional(),
          breach: z.boolean().optional(),
          trend: z.boolean().optional(),
        })
        .optional(),
      additionalEmails: z.array(z.string().email()).max(10).optional(),
    })
    .optional(),
  ownerProfile: z
    .object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      state: z.string().length(2),
      county: z.string().optional(),
      householdSize: z.coerce.number().min(1),
    })
    .optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { name, state, householdSize, onboardingStep, notificationPrefs, ownerProfile } =
    parsed.data;
  if (name !== undefined) user.name = name;
  if (onboardingStep !== undefined) user.onboardingStep = onboardingStep;
  if (notificationPrefs?.frequency) {
    user.notificationPrefs = user.notificationPrefs ?? {};
    user.notificationPrefs.frequency = notificationPrefs.frequency;
  }
  if (notificationPrefs?.email !== undefined) {
    user.notificationPrefs = user.notificationPrefs ?? {};
    user.notificationPrefs.email = notificationPrefs.email;
  }
  if (notificationPrefs?.alertTypes) {
    user.notificationPrefs = user.notificationPrefs ?? {};
    const current = user.notificationPrefs.alertTypes ?? {
      predictive: true,
      breach: true,
      trend: true,
    };
    const next = notificationPrefs.alertTypes;
    user.notificationPrefs.alertTypes = {
      predictive: next.predictive ?? current.predictive,
      breach: next.breach ?? current.breach,
      trend: next.trend ?? current.trend,
    };
  }
  if (notificationPrefs?.additionalEmails !== undefined) {
    user.notificationPrefs = user.notificationPrefs ?? {};
    // De-duplicate, normalize, and drop the primary if it slipped into the list.
    user.notificationPrefs.additionalEmails = Array.from(
      new Set(notificationPrefs.additionalEmails.map((e) => e.toLowerCase().trim())),
    ).filter(Boolean);
  }
  await user.save();

  if (ownerProfile) {
    const filter = { ownerUserId: session.user.id, isOwner: true };
    let ben = await Beneficiary.findOne(filter);
    if (!ben) {
      ben = await Beneficiary.create({
        ...filter,
        firstName: ownerProfile.firstName,
        lastName: ownerProfile.lastName,
        state: ownerProfile.state.toUpperCase(),
        county: ownerProfile.county ?? "",
        householdSize: ownerProfile.householdSize,
        isOwner: true,
      });
      await logActivity({
        userId: session.user.id,
        beneficiaryId: ben._id,
        category: "beneficiary",
        action: "beneficiary.created",
        resourceType: "beneficiary",
        resourceId: ben._id.toString(),
        details: { isOwner: true },
      });
    } else {
      ben.firstName = ownerProfile.firstName;
      ben.lastName = ownerProfile.lastName;
      ben.state = ownerProfile.state.toUpperCase();
      ben.county = ownerProfile.county ?? "";
      ben.householdSize = ownerProfile.householdSize;
      await ben.save();
      await logActivity({
        userId: session.user.id,
        beneficiaryId: ben._id,
        category: "beneficiary",
        action: "beneficiary.updated",
        details: { state: ben.state, householdSize: ben.householdSize },
      });
    }
  } else if (state !== undefined || householdSize !== undefined) {
    const ben = await Beneficiary.findOne({ ownerUserId: session.user.id, isOwner: true });
    if (ben) {
      if (state !== undefined) ben.state = state.toUpperCase();
      if (householdSize !== undefined) ben.householdSize = householdSize;
      await ben.save();
      await logActivity({
        userId: session.user.id,
        beneficiaryId: ben._id,
        category: "beneficiary",
        action: "beneficiary.updated",
        details: { state, householdSize },
      });
    }
  }

  if (name !== undefined || onboardingStep !== undefined) {
    await logActivity({
      userId: session.user.id,
      category: "account",
      action: "profile.updated",
      details: { name, onboardingStep },
    });
  }

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      onboardingStep: user.onboardingStep,
      notificationPrefs: user.notificationPrefs,
    },
  });
}
