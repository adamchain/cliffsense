import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Application from "@/lib/db/models/Application";
import ApplicationDocument from "@/lib/db/models/ApplicationDocument";
import { serializeApplication } from "@/lib/applications/serialize";
import { ApplicationReview } from "./application-review";

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  await connectDB();
  const app = await Application.findById(id);
  if (!app) notFound();
  const [user, docs] = await Promise.all([
    User.findById(app.userId).select("email name accountType applicationStatus createdAt").lean(),
    ApplicationDocument.find({ applicationId: app._id }).select("-content").sort({ createdAt: -1 }),
  ]);

  return (
    <>
      <div className="mb-3">
        <Link href="/admin/applications" className="text-[12px] text-[var(--color-cs-brand)] hover:underline">
          ← All applications
        </Link>
      </div>
      <ApplicationReview
        application={serializeApplication(app, docs)}
        applicant={{ email: user?.email ?? "", name: user?.name ?? "" }}
      />
    </>
  );
}
