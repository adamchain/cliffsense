import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ApplicationDocument from "@/lib/db/models/ApplicationDocument";
import { serializeApplication } from "@/lib/applications/serialize";
import { ensureApplication } from "@/lib/applications/ensure";
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
  const docs = await ApplicationDocument.find({ applicationId: app._id })
    .select("-content")
    .sort({ createdAt: -1 });
  return <ApplicationClient initial={serializeApplication(app, docs)} />;
}
