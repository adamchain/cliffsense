"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  IconCalendarEvent,
  IconChevronDown,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import { WalletCardGroup } from "@/components/benefits/wallet-card";
import { PlaidConnectModal } from "@/components/plaid/plaid-connect-modal";
import type { ProgramCardModel } from "@/lib/benefits/program-tier";

type UpcomingItem = {
  id: string;
  title: string;
  subtitle: string;
  mon: string;
  day: string;
  rel: string;
  href: string;
  kind?: string;
};

export function HomeDashboard({
  beneficiaryName,
  beneficiaryId,
  bankCount,
  federal,
  state,
  upcoming,
}: {
  beneficiaryName: string;
  beneficiaryId: string | null;
  bankCount: number;
  federal: ProgramCardModel[];
  state: ProgramCardModel[];
  upcoming: UpcomingItem[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  return (
    <div className="mx-auto w-full max-w-3xl lg:max-w-5xl">
      <div className="cs-eyebrow">Benefits · {todayLabel}</div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <Link
          href="/beneficiaries"
          data-tour="home-beneficiary"
          className="group flex min-w-0 items-center gap-1.5 text-[var(--color-cs-text)]"
        >
          <h1 className="cs-big-title truncate">{beneficiaryName}</h1>
          <IconChevronDown
            size={17}
            stroke={3}
            className="shrink-0 text-[var(--color-cs-text-muted)]"
            aria-hidden
          />
        </Link>
        <div className="flex shrink-0 gap-2">
          <Link href="/calendar" className="cs-circbtn" aria-label="Calendar">
            <IconCalendarEvent size={19} stroke={2} />
          </Link>
          <button
            type="button"
            className="cs-circbtn"
            aria-label="Quick actions"
            onClick={() => setAddOpen(true)}
          >
            <IconPlus size={20} stroke={2.2} />
          </button>
        </div>
      </div>

      {federal.length === 0 && state.length === 0 ? (
        <div className="mt-6 rounded-[18px] bg-[var(--color-cs-card)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]" data-tour="home-programs">
          <h2 className="text-[17px] font-semibold text-[var(--color-cs-text)]">
            No programs yet
          </h2>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            Select enrolled programs and connect a bank to see wallet-style benefit cards here.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/thresholds" className="cs-btn cs-btn-primary">
              Set up limits
            </Link>
            {beneficiaryId ? (
              <PlaidConnectModal
                primaryBeneficiaryId={beneficiaryId}
                variant="toolbar"
                label="Connect bank"
              />
            ) : (
              <Link href="/onboarding/profile" className="cs-btn cs-btn-secondary">
                Continue onboarding
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-2 grid gap-2 lg:grid-cols-2 lg:items-start lg:gap-8">
          <div data-tour="home-programs">
            <WalletCardGroup title="Federal" countLabel="SSA" cards={federal} />
            <WalletCardGroup title="State" countLabel="Pennsylvania" cards={state} />
          </div>
          <div className="lg:sticky lg:top-24" data-tour="home-upcoming">
            <div className="mb-3 mt-6 flex items-baseline justify-between px-0.5 lg:mt-6">
              <h2 className="text-[22px] font-bold tracking-tight text-[var(--color-cs-text)]">
                Upcoming
              </h2>
              <Link
                href="/calendar"
                className="text-[15px] font-normal text-[var(--color-cs-brand)]"
              >
                Calendar
              </Link>
            </div>
            {(() => {
              const renewals = upcoming.filter((e) => e.kind === "renewal");
              const rest = upcoming.filter((e) => e.kind !== "renewal");
              const renderList = (items: UpcomingItem[]) => (
                <div className="cs-ios-list">
                  {items.map((e) => (
                    <Link key={e.id} href={e.href} className="cs-ios-row">
                      <div className="cs-datechip">
                        <div className="m">{e.mon}</div>
                        <div className="d">{e.day}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[16px] font-semibold text-[var(--color-cs-text)]">
                          {e.title}
                        </div>
                        <div className="mt-0.5 truncate text-[12.5px] text-[var(--color-cs-text-secondary)]">
                          {e.subtitle}
                        </div>
                      </div>
                      <div className="shrink-0 text-[13px] font-medium text-[var(--color-cs-text-secondary)]">
                        {e.rel}
                      </div>
                      <span
                        className="text-[18px] font-light leading-none text-[var(--color-cs-text-muted)]"
                        aria-hidden
                      >
                        ›
                      </span>
                    </Link>
                  ))}
                </div>
              );
              if (upcoming.length === 0) {
                return (
                  <div className="rounded-[18px] bg-white px-4 py-5 text-[13.5px] text-[var(--color-cs-text-secondary)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                    No renewals or deadlines yet. Set them in{" "}
                    <Link href="/settings" className="text-[var(--color-cs-brand)]">
                      Settings
                    </Link>{" "}
                    or{" "}
                    <Link href="/calendar" className="text-[var(--color-cs-brand)]">
                      Calendar
                    </Link>
                    .
                  </div>
                );
              }
              return (
                <div className="space-y-4">
                  {renewals.length > 0 && (
                    <div>
                      <div className="mb-2 px-0.5 text-[13px] font-semibold uppercase tracking-wide text-[var(--color-cs-warning)]">
                        Renewals
                      </div>
                      {renderList(renewals)}
                    </div>
                  )}
                  {rest.length > 0 && (
                    <div>
                      {renewals.length > 0 && (
                        <div className="mb-2 px-0.5 text-[13px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
                          Reporting deadlines
                        </div>
                      )}
                      {renderList(rest)}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-4 hidden rounded-[18px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] lg:block">
              <div className="text-[13px] text-[var(--color-cs-text-secondary)]">Linked banks</div>
              <div className="mt-1 text-[20px] font-semibold tabular-nums">
                {bankCount} active
              </div>
              <Link
                href="/transactions"
                className="mt-2 inline-block text-[15px] text-[var(--color-cs-brand)]"
              >
                Manage accounts
              </Link>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Quick actions">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAddOpen(false)} />
          <div className="cs-safe-bottom absolute inset-x-0 bottom-0 max-h-[84%] overflow-y-auto rounded-t-[22px] bg-[var(--color-cs-surface)] pb-8 pt-2">
            <div className="mx-auto mb-2 h-[5px] w-[38px] rounded-full bg-[var(--color-cs-text-muted)]" />
            <div className="flex items-start justify-between px-5">
              <div>
                <h2 className="text-[22px] font-bold tracking-tight">Quick actions</h2>
                <p className="mt-1 text-[13.5px] text-[var(--color-cs-text-secondary)]">
                  Track a limit, connect a bank, or export data.
                </p>
              </div>
              <button type="button" className="cs-circbtn" aria-label="Close" onClick={() => setAddOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-2.5 px-4">
              <Link
                href="/thresholds"
                onClick={() => setAddOpen(false)}
                className="flex items-center gap-3.5 rounded-[14px] bg-[var(--color-cs-card)] px-4 py-3.5 text-[17px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[var(--color-cs-brand)] text-white">
                  <IconPlus size={19} stroke={2.2} />
                </span>
                Add a limit to track
              </Link>
              <div className="rounded-[14px] bg-[var(--color-cs-card)] px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                {beneficiaryId ? (
                  <PlaidConnectModal
                    primaryBeneficiaryId={beneficiaryId}
                    variant="toolbar"
                    label="Connect a bank"
                  />
                ) : (
                  <Link href="/onboarding/plaid" className="text-[17px] text-[var(--color-cs-brand)]">
                    Connect a bank
                  </Link>
                )}
              </div>
              <Link
                href="/transactions"
                onClick={() => setAddOpen(false)}
                className="flex items-center gap-3.5 rounded-[14px] bg-[var(--color-cs-card)] px-4 py-3.5 text-[17px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                Import / review transactions
              </Link>
              <Link
                href="/reports"
                onClick={() => setAddOpen(false)}
                className="flex items-center gap-3.5 rounded-[14px] bg-[var(--color-cs-card)] px-4 py-3.5 text-[17px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                Export data
              </Link>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-[14px] bg-[var(--color-cs-card)] py-3.5 text-center text-[17px] font-semibold text-[var(--color-cs-brand)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
