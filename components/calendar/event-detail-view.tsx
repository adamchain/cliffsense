"use client";

import Link from "next/link";
import {
  IconArrowLeft,
  IconBriefcase,
  IconCheck,
  IconClock,
  IconExternalLink,
  IconFileText,
  IconFolder,
  IconMapPin,
  IconSparkles,
  IconWallet,
} from "@tabler/icons-react";
import { advisorAskHref, programOverviewQuestion } from "@/lib/benefits/fix-prompts";
import { programCodeKey, programMetaFor } from "@/lib/benefits/program-meta";
import { programAgencyTag, programTier, formatUsdCents } from "@/lib/benefits/program-tier";
import { PaKeystoneMark, SsaSeal, UsFlagMark } from "@/components/benefits/wallet-seals";
import {
  buildEventPrepPackage,
  type EventPrepItem,
} from "@/lib/calendar/event-prep";
import { filingLocationForEvent } from "@/lib/calendar/filing-location";

export type EventDetailModel = {
  title: string;
  date: string;
  timeLabel?: string;
  program: string | null;
  kind: string;
  detail: string;
  channelLabel?: string | null;
  channelUrl?: string | null;
  note?: string | null;
  estimatedWagesCents?: number | null;
  estimatedWagesNote?: string | null;
  reportingPeriodLabel?: string | null;
  howToFile?: string | null;
  source: "user" | "generated";
  deadlineId?: string | null;
};

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysUntil(iso: string): number {
  const today = new Date(`${todayIso()}T00:00:00`);
  const target = new Date(`${iso}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function relativeDateLabel(iso: string): string {
  const days = daysUntil(iso);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 21) return `in ${days} days`;
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function longDeadline(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function dateChipParts(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return {
    mon: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
  };
}

function defaultReportingPeriod(iso: string, title: string): string | null {
  if (!/wage|earnings|income/i.test(title)) return null;
  const d = new Date(`${iso}T12:00:00`);
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return `${prev.toLocaleDateString("en-US", { month: "long", year: "numeric" })} earnings`;
}

function displayTitle(event: EventDetailModel): string {
  if (/report last month'?s wages/i.test(event.title) && programCodeKey(event.program ?? "") === "SSI") {
    return "SSI Wage Report";
  }
  if (event.kind === "renewal" && event.program) {
    const label = programMetaFor(programCodeKey(event.program))?.label ?? event.program;
    if (!/renewal/i.test(event.title)) return `${label} Renewal`;
  }
  return event.title;
}

function prepIcon(item: EventPrepItem) {
  if (item.id === "advisor") return IconSparkles;
  if (item.id === "file" || item.kind === "link") return IconExternalLink;
  if (item.href?.includes("transactions") || item.id === "review-wages") return IconWallet;
  if (item.href?.includes("vault")) return IconFolder;
  if (item.href?.includes("documents")) return IconFileText;
  if (item.kind === "review") return IconBriefcase;
  return IconCheck;
}

function PrepCard({ item }: { item: EventPrepItem }) {
  const Icon = prepIcon(item);
  const inner = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--color-cs-brand)]/10 text-[var(--color-cs-brand)]">
        <Icon size={20} stroke={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-[var(--color-cs-text)]">
          {item.title}
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-[var(--color-cs-text-secondary)]">
          {item.detail}
        </span>
      </span>
      <span className="self-center text-[18px] font-light text-[var(--color-cs-text-muted)]" aria-hidden>
        ›
      </span>
    </>
  );
  const className =
    "flex gap-3 rounded-[18px] bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-white/90";

  if (!item.href) return <div className={className}>{inner}</div>;
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={item.href} className={className}>
      {inner}
    </Link>
  );
}

export function EventDetailView({ event }: { event: EventDetailModel }) {
  const code = event.program ? programCodeKey(event.program) : null;
  const meta = code ? programMetaFor(code) : null;
  const fed = code ? programTier(code) === "federal" : true;
  const agencyTag = code ? programAgencyTag(code) : "MYBENEFITSPA";
  const title = displayTitle(event);
  const channelLabel = event.channelLabel ?? (code === "SSI" ? "myWageReport" : "File online");
  const channelUrl =
    event.channelUrl ??
    meta?.officialUrl ??
    (code === "SSI" ? "https://www.ssa.gov/ssi/wage-reporting.html" : null);
  const reportingPeriod =
    event.reportingPeriodLabel ?? defaultReportingPeriod(event.date, event.title);
  const howToFile =
    event.howToFile ??
    (channelUrl ? "Online, phone, or mail" : meta?.reporting ?? "Confirm with the agency");
  const timeLabel = event.timeLabel ?? "5:00 PM";
  const chip = dateChipParts(event.date);
  const days = daysUntil(event.date);
  const rel = relativeDateLabel(event.date);
  const place = filingLocationForEvent({
    program: event.program,
    channelLabel,
    channelUrl,
  });

  const advisorHref = advisorAskHref(
    code
      ? `Help me prepare for this deadline: ${title} on ${event.date} for ${meta?.label ?? code}. ${event.detail}`
      : `Help me prepare for this deadline: ${title} on ${event.date}. ${event.detail}`,
  );
  const programHref = code ? `/thresholds/${code}` : "/thresholds";
  const ctaLabel =
    event.kind === "renewal"
      ? "Review renewal steps"
      : channelUrl
        ? "Review & file report"
        : "Ask Advisor for next steps";
  const ctaHref = channelUrl ?? advisorHref;

  const prep = buildEventPrepPackage({
    title: event.title,
    kind: event.kind,
    program: event.program,
    channelLabel,
    channelUrl,
    estimatedWagesCents: event.estimatedWagesCents,
  });
  const prepItems = prep.items.map((item) =>
    item.id === "advisor" ? { ...item, href: advisorHref } : item,
  );

  const kindLabel =
    event.kind === "renewal"
      ? "Renewal"
      : /wage|earnings/i.test(event.title)
        ? "Wage report"
        : "Deadline";

  return (
    <div className="mx-auto max-w-5xl pb-8">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link
          href="/calendar"
          className="cs-circbtn !bg-white/75 shadow-sm"
          aria-label="Back to calendar"
        >
          <IconArrowLeft size={18} stroke={2.2} />
        </Link>
        <div className="flex gap-2">
          <Link
            href={advisorHref}
            className="cs-circbtn !bg-white/75 shadow-sm"
            aria-label="Ask Advisor"
          >
            <IconSparkles size={17} stroke={2} />
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr] lg:items-start">
        {/* Left: event ticket + location map */}
        <div>
          <div className={`cs-hero ${fed ? "cs-hero--fed" : "cs-hero--state"}`}>
            <div className="cs-wcard-seal" aria-hidden>
              {fed ? <SsaSeal /> : <PaKeystoneMark />}
            </div>
            <div className="relative z-[1] flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="cs-hero-tag">
                  {fed ? <UsFlagMark className="cs-fed-flag" /> : null}
                  {agencyTag} · {kindLabel}
                </div>
                <h1 className="cs-hero-name mt-2 !text-[26px] !leading-tight">{title}</h1>
                {reportingPeriod && (
                  <p
                    className={`mt-2 text-[13px] ${
                      fed ? "text-white/75" : "text-[var(--color-cs-text-secondary)]"
                    }`}
                  >
                    Reporting period · {reportingPeriod}
                  </p>
                )}
              </div>
              <div
                className={`flex h-[72px] w-[64px] shrink-0 flex-col items-center justify-center rounded-[14px] ${
                  fed ? "bg-white/15 text-white" : "bg-white text-[var(--color-cs-pa-navy)]"
                }`}
              >
                <div
                  className={`text-[11px] font-bold tracking-wide ${
                    fed ? "text-[#ffb4b4]" : "text-[#d4af69]"
                  }`}
                >
                  {chip.mon}
                </div>
                <div className="text-[28px] font-bold leading-none tracking-tight">{chip.day}</div>
                <div className={`mt-0.5 text-[10px] font-semibold uppercase opacity-70`}>
                  {chip.weekday}
                </div>
              </div>
            </div>
            <div className="cs-hero-bottom relative z-[1] mt-6">
              <div>
                <div className="cs-hero-label">
                  {event.estimatedWagesCents != null ? "Estimated wages" : "Due by"}
                </div>
                <div className="cs-hero-limit !text-[15px] !opacity-95">
                  {event.estimatedWagesCents != null
                    ? `${formatUsdCents(event.estimatedWagesCents)}${
                        event.estimatedWagesNote ? ` · ${event.estimatedWagesNote}` : ""
                      }`
                    : `${timeLabel} · ${rel}`}
                </div>
              </div>
              <div
                className={`text-right text-[22px] font-bold tabular-nums tracking-tight ${
                  days <= 7 && days >= 0
                    ? fed
                      ? "text-[#ffd0d0]"
                      : "text-[#d4af69]"
                    : ""
                }`}
              >
                {rel}
              </div>
            </div>
          </div>

          {/* Snapshot strip */}
          <div className="mt-3.5 flex overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex-1 px-2 py-3 text-center">
              <div className="text-[13px] font-bold leading-snug">{chip.weekday}</div>
              <div className="mt-0.5 text-[11.5px] text-[var(--color-cs-text-secondary)]">
                {chip.mon} {chip.day}
              </div>
            </div>
            <div className="flex-1 border-l border-[var(--color-cs-sep)] px-2 py-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[13px] font-bold">
                <IconClock size={14} stroke={2} className="text-[var(--color-cs-text-secondary)]" />
                {timeLabel}
              </div>
              <div className="mt-0.5 text-[11.5px] text-[var(--color-cs-text-secondary)]">Deadline</div>
            </div>
            <div className="flex-1 border-l border-[var(--color-cs-sep)] px-2 py-3 text-center">
              <div
                className={`text-[13px] font-bold tabular-nums ${
                  days <= 7 ? "text-[var(--color-cs-danger)]" : ""
                }`}
              >
                {days < 0 ? `${Math.abs(days)}d late` : days === 0 ? "Today" : `${days}d`}
              </div>
              <div className="mt-0.5 text-[11.5px] text-[var(--color-cs-text-secondary)]">Left</div>
            </div>
          </div>

          {/* Location / map card */}
          <div className="mt-4 overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="relative h-[168px] bg-[#dce6ef]">
              <iframe
                title={`Map of ${place.name}`}
                src={place.mapsEmbedUrl}
                className="absolute inset-0 h-full w-full border-0 grayscale-[20%] contrast-[1.05]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
              <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-cs-text)] shadow-sm">
                <IconMapPin size={13} className="text-[var(--color-cs-pa-red)]" stroke={2.2} />
                Where to file
              </div>
            </div>
            <div className="px-4 pb-4 pt-1">
              <div className="text-[17px] font-bold text-[var(--color-cs-text)]">{place.name}</div>
              <div className="mt-0.5 text-[12.5px] text-[var(--color-cs-text-secondary)]">
                {place.role}
              </div>
              <div className="mt-3 flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-cs-surface)] text-[var(--color-cs-brand)]">
                  <IconMapPin size={18} stroke={1.8} />
                </span>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-[var(--color-cs-text)]">
                    {place.line1}
                  </div>
                  <div className="text-[13px] text-[var(--color-cs-text-secondary)]">{place.line2}</div>
                  <div className="mt-1 text-[12px] text-[var(--color-cs-text-muted)]">{howToFile}</div>
                </div>
              </div>
              <div className="mt-3.5 flex flex-wrap gap-2">
                {channelUrl && (
                  <a
                    href={channelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="cs-btn cs-btn-primary !h-9 !rounded-full !px-3.5 !text-[13px]"
                  >
                    {place.onlineFirst ? "File online" : "Open channel"}
                    <IconExternalLink size={14} />
                  </a>
                )}
                <a
                  href={place.directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="cs-btn cs-btn-secondary !h-9 !rounded-full !px-3.5 !text-[13px]"
                >
                  Directions
                </a>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="mt-4 rounded-[18px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <h2 className="text-[17px] font-bold text-[var(--color-cs-text)]">About this deadline</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              {event.detail ||
                meta?.reporting ||
                "Use the prep checklist to gather what you need, then file on the official channel before the due date."}
            </p>
            {event.note && event.note !== event.detail && (
              <p className="mt-3 rounded-[12px] bg-[var(--color-cs-surface)] px-3 py-2.5 text-[13px] text-[var(--color-cs-text)]">
                {event.note}
              </p>
            )}
            {meta && (
              <>
                <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
                  Program
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-cs-text)]">
                  {meta.fullName} · administered by {meta.agency}.
                </p>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
                  <Link href={programHref} className="font-semibold text-[var(--color-cs-brand)]">
                    View {meta.label} limits
                  </Link>
                  <Link
                    href={advisorAskHref(programOverviewQuestion(code!))}
                    className="font-semibold text-[var(--color-cs-brand)]"
                  >
                    Program overview
                  </Link>
                </div>
              </>
            )}
          </div>

          <p className="mt-3 px-1 text-[12px] leading-snug text-[var(--color-cs-text-secondary)]">
            Due {longDeadline(event.date)}. Nothing you prepare here is shared with any agency —
            MyBenefitsPA only helps you organize before you file.
          </p>
        </div>

        {/* Right: prep package */}
        <aside className="lg:sticky lg:top-24">
          <div className="mb-2 flex items-baseline justify-between px-0.5">
            <h2 className="text-[22px] font-bold tracking-tight">{prep.headline}</h2>
            <Link href={advisorHref} className="text-[15px] text-[var(--color-cs-brand)]">
              Ask Advisor
            </Link>
          </div>
          <p className="mb-3 px-0.5 text-[13.5px] leading-snug text-[var(--color-cs-text-secondary)]">
            {prep.summary}
          </p>

          <div className="space-y-2.5">
            {prepItems.map((item) => (
              <PrepCard key={item.id} item={item} />
            ))}
          </div>

          {ctaHref.startsWith("/") ? (
            <Link
              href={ctaHref}
              className="cs-btn cs-btn-primary mt-4 w-full justify-center py-3.5 text-[16px]"
            >
              {ctaLabel}
            </Link>
          ) : (
            <a
              href={ctaHref}
              target="_blank"
              rel="noreferrer"
              className="cs-btn cs-btn-primary mt-4 w-full justify-center py-3.5 text-[16px]"
            >
              {ctaLabel}
              <IconExternalLink size={16} />
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}
