import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ApplicationDocument from "@/lib/db/models/ApplicationDocument";
import User from "@/lib/db/models/User";
import { serializeApplication } from "@/lib/applications/serialize";
import { ensureApplication } from "@/lib/applications/ensure";
import { onboardingPathForStep } from "@/lib/onboarding/steps";
import { connectDB } from "@/lib/db/mongodb";
import { ApplicationClient } from "./application-client";

export const metadata = { title: "Your application · MyBenefitsPA" };

export default async function ApplicationPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  const app = await ensureApplication(session.user.id, session.user.accountType);
  if (!app) {
    // Non-reviewed role (self-beneficiary / already-approved) — let the
    // middleware route them onward.
    redirect("/dashboard");
  }

  // Heal User↔Application desync and leave without a client reload loop when
  // the JWT already reflects approval.
  if (app.status === "approved") {
    const jwtStatus = session.user.applicationStatus ?? "approved";
    if (jwtStatus !== "approved") {
      await connectDB();
      await User.updateOne(
        { _id: session.user.id },
        { $set: { applicationStatus: "approved" } },
      );
    } else {
      const step = session.user.onboardingStep ?? "none";
      redirect(step === "complete" ? "/dashboard" : onboardingPathForStep(step));
    }
  }

  const docs = await ApplicationDocument.find({ applicationId: app._id })
    .select("-content")
    .sort({ createdAt: -1 });
  return <ApplicationClient initial={serializeApplication(app, docs)} />;
}
