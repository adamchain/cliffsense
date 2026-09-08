import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getActiveBeneficiaryForUser } from "@/lib/beneficiaries/active";
import { ReportingCalendarView } from "@/components/calendar/reporting-calendar-view";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const primary = await getActiveBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;

  return <ReportingCalendarView beneficiaryId={beneficiaryId} />;
}
