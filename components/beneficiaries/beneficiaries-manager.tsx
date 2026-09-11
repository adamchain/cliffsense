"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BeneficiaryProfileForm,
  type BeneficiaryProfileValues,
} from "@/components/beneficiaries/beneficiary-profile-form";

export type BeneficiaryListItem = {
  id: string;
  roleChip: string | null;
  canWrite: boolean;
  programs: string[];
  banks: number;
  profile: BeneficiaryProfileValues;
};

export function BeneficiariesManager({
  people,
  initialEditId,
}: {
  people: BeneficiaryListItem[];
  initialEditId: string | null;
}) {
  const defaultOpen = useMemo(() => {
    if (initialEditId && people.some((p) => p.id === initialEditId)) return initialEditId;
    if (people.length === 1) return people[0]!.id;
    return null;
  }, [initialEditId, people]);
  const [openId, setOpenId] = useState<string | null>(defaultOpen);

  return (
    <ul className="space-y-3">
      {people.map((p) => {
        const open = openId === p.id;
        const name = `${p.profile.firstName} ${p.profile.lastName}`.trim();
        return (
          <li
            key={p.id}
            className="rounded-lg border border-[var(--color-cs-border)] bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-[15px] font-semibold text-[var(--color-cs-text)]">
                    {name || "Unnamed"}
                  </h2>
                  {p.roleChip && (
                    <span className="rounded bg-[var(--color-cs-info-bg)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--color-cs-info)]">
                      {p.roleChip}
                    </span>
                  )}
                </div>
                {!open && (
                  <p className="mt-0.5 text-[12px] text-[var(--color-cs-text-secondary)]">
                    {[
                      p.profile.state || null,
                      p.banks ? `${p.banks} bank${p.banks === 1 ? "" : "s"}` : null,
                      p.programs.length ? p.programs.join(", ") : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No details yet"}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : p.id)}
                  className="rounded-md border border-[var(--color-cs-border)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--color-cs-text)] hover:bg-[var(--color-cs-nav-hover)]"
                >
                  {open ? "Close" : p.canWrite ? "Edit details" : "View details"}
                </button>
                <Link
                  href={`/beneficiaries/${p.id}`}
                  className="text-[12px] font-medium text-[var(--color-cs-brand)] hover:underline"
                >
                  Banks & sharing
                </Link>
              </div>
            </div>
            {open && (
              <div className="mt-4 border-t border-[var(--color-cs-sep)] pt-4">
                <BeneficiaryProfileForm
                  beneficiaryId={p.id}
                  initial={p.profile}
                  canWrite={p.canWrite}
                  compact
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
