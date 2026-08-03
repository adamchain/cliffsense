import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrimaryBeneficiaryForUser } from "@/lib/beneficiaries/access";
import { connectDB } from "@/lib/db/mongodb";
import ReportingDeadline from "@/lib/db/models/ReportingDeadline";
import {
  fixedScheduleEventsForPrograms,
  scheduleFor,
} from "@/lib/benefits/reporting-schedules";
import { decodeCalendarEventId } from "@/lib/calendar/event-id";
import { loadThresholdDashboardPayload } from "@/lib/thresholds/threshold-dashboard";
import { grossUpEarnedCents } from "@/lib/thresholds/metrics";
import { programCodeKey } from "@/lib/benefits/program-meta";
import {
  EventDetailView,
  type EventDetailModel,
} from "@/components/calendar/event-detail-view";

export default async function CalendarEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  const { id: rawId } = await params;
  const ref = decodeCalendarEventId(rawId);
  if (!ref) notFound();

  const primary = await getPrimaryBeneficiaryForUser(session.user.id);
  if (!primary) {
    redirect("/onboarding/profile");
  }
  const beneficiaryId = primary._id;

  let event: EventDetailModel | null = null;

  if (ref.source === "user") {
    await connectDB();
    const row = await ReportingDeadline.findOne({
      _id: ref.deadlineId,
      beneficiaryId,
    }).lean();
    if (!row) notFound();
    const program = (row.program as string | null) ?? null;
    const ch = program ? scheduleFor(program)?.channel : null;
    const kind =
      (row as { kind?: string }).kind === "renewal" ||
      String((row as { sourceKey?: string }).sourceKey ?? "").startsWith("renewal:") ||
      /\brenewal\b/i.test(String(row.title ?? ""))
        ? "renewal"
        : String((row as { kind?: string }).kind ?? "deadline");
    event = {
      title: String(row.title ?? "Deadline"),
      date: (row.dueDate as Date).toISOString().slice(0, 10),
      program,
      kind,
      detail: String(row.note ?? ""),
      note: String(row.note ?? "") || null,
      channelLabel: ch?.label ?? null,
      channelUrl: ch?.url ?? null,
      source: "user",
      deadlineId: String(row._id),
    };
  } else {
    await connectDB();
    const payload = await loadThresholdDashboardPayload(beneficiaryId);
    const programs = payload.programsEnrolled?.length
      ? payload.programsEnrolled
      : [ref.program];
    const found =
      fixedScheduleEventsForPrograms(programs, new Date()).find(
        (g) =>
          programCodeKey(g.program) === programCodeKey(ref.program) &&
          g.date === ref.date &&
          g.title === ref.title,
      ) ??
      fixedScheduleEventsForPrograms([ref.program], new Date()).find(
        (g) => g.date === ref.date && g.title === ref.title,
      );

    if (!found) {
      // Still show a detail page from the encoded ref if the generated window moved.
      event = {
        title: ref.title,
        date: ref.date,
        program: ref.program,
        kind: "deadline",
        detail: "",
        channelLabel: scheduleFor(ref.program)?.channel.label ?? null,
        channelUrl: scheduleFor(ref.program)?.channel.url ?? null,
        source: "generated",
      };
    } else {
      event = {
        title: found.title,
        date: found.date,
        program: found.program,
        kind: "deadline",
        detail: found.detail,
        channelLabel: found.channelLabel,
        channelUrl: found.channelUrl ?? null,
        source: "generated",
      };
    }

    // Wage reports cover LAST month's earnings (e.g. Aug 6 report → July wages).
    if (/wage|earnings/i.test(event.title)) {
      const priorNet = payload.metrics.priorMonthEarnedIncomeCents ?? 0;
      const priorGross = grossUpEarnedCents(priorNet);
      event.estimatedWagesCents = priorGross;
      event.reportingPeriodLabel =
        event.reportingPeriodLabel ??
        (() => {
          const [y, m] = (payload.priorMonthPrefix || "").split("-").map(Number);
          if (!y || !m) return null;
          return `${new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })} earnings`;
        })();
      const code = programCodeKey(event.program ?? "");
      const row = payload.rows.find(
        (r) =>
          r.attached &&
          r.program &&
          programCodeKey(r.program) === code &&
          r.thresholdType === "monthly_earned_income",
      );
      if (row && row.limitCents > 0) {
        event.estimatedWagesNote =
          priorGross <= row.limitCents ? "under limit" : "over limit";
      }
    }
  }

  if (!event) notFound();

  return <EventDetailView event={event} />;
}
