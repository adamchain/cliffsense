import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getActiveBeneficiaryForUser } from "@/lib/beneficiaries/active";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { TasksView } from "@/components/tasks/tasks-view";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const primary = await getActiveBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;

  let programs: string[] = [];
  if (beneficiaryId) {
    await connectDB();
    const ben = await Beneficiary.findById(beneficiaryId).select("benefitsEnrolled").lean();
    programs = Array.isArray(ben?.benefitsEnrolled)
      ? ben!.benefitsEnrolled.map((b) => String(b.program)).filter(Boolean)
      : [];
  }

  return <TasksView beneficiaryId={beneficiaryId} programs={programs} />;
}
