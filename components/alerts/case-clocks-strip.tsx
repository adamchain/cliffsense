"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { calendarEventHref } from "@/lib/calendar/event-id";
import {
  DEADLINE_KIND_LABEL,
  isCaseClockKind,
  isDeadlineKind,
} from "@/lib/calendar/deadline-kinds";

type Clock = {
  _id: string;
  program: string | null;
  dueDate: string;
  kind: string;
  title: string;
  completedAt: string | null;
};

export function CaseClocksStrip({ beneficiaryId }: { beneficiaryId: string | null }) {
  const [rows, setRows] = useState<Clock[]>([]);

  useEffect(() => {
    if (!beneficiaryId) return;
    void fetch(`/api/reporting-deadlines?beneficiaryId=${encodeURIComponent(beneficiaryId)}`)
      .then((r) => r.json())
      .then((data: { deadlines?: Clock[] }) => {
        setRows((data.deadlines ?? []).filter((d) => !d.completedAt && isCaseClockKind(d.kind)));
      })
      .catch(() => setRows([]));
  }, [beneficiaryId]);

  if (!beneficiaryId) return null;

  return (
    <div className="mb-5 rounded-[18px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-bold text-[var(--color-cs-text)]">Case clocks</h2>
        <Link href="/calendar" className="text-[12px] font-semibold text-[var(--color-cs-brand)]">
          Add on Calendar
        </Link>
      </div>
      <p className="mt-1 text-[12px] text-[var(--color-cs-text-secondary)]">
        Interviews, verifications, MAWD premiums, CDRs, waiver assessments, appeals, and
        continued-benefit dates — from the notice, not guessed from a closure code.
      </p>
      {rows.length === 0 ? (
        <p className="mt-2 text-[13px] text-[var(--color-cs-text-secondary)]">
          None yet. Add them from Calendar when a notice arrives.
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {rows
            .slice()
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            .map((d) => (
              <li key={d._id}>
                <Link
                  href={calendarEventHref({ source: "user", deadlineId: d._id })}
                  className="flex items-baseline justify-between gap-2 text-[13px]"
                >
                  <span className="font-medium text-[var(--color-cs-text)]">{d.title}</span>
                  <span className="shrink-0 text-[12px] text-[var(--color-cs-text-secondary)]">
                    {isDeadlineKind(d.kind) ? DEADLINE_KIND_LABEL[d.kind] : d.kind} · {d.dueDate}
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
