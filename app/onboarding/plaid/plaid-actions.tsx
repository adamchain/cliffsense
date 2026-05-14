"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { IconArrowRight } from "@tabler/icons-react";
import { PlaidConnectButton } from "@/components/plaid/plaid-connect-button";

export function PlaidOnboardingActions({ beneficiaryId }: { beneficiaryId: string | null }) {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);

  async function advanceToBenefits() {
    setLoading(true);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingStep: "benefits" }),
    });
    await update({ onboardingStep: "benefits" });
    router.push("/onboarding/benefits");
    router.refresh();
    setLoading(false);
  }

  async function skip() {
    await advanceToBenefits();
  }

  if (!beneficiaryId) {
    return (
      <div className="mt-6 rounded border border-[#deecf9] bg-[var(--color-cs-info-bg)] p-4 text-left">
        <p className="text-[13px] font-medium text-[var(--color-cs-text)]">
          We couldn&apos;t set up a beneficiary profile for your account yet.
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-cs-text-secondary)]">
          Try refreshing the page. If this keeps happening, complete the profile step with your name and state, or sign
          out and sign back in.
        </p>
        <Link
          href="/onboarding/profile"
          className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-[var(--color-cs-brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-cs-brand-hover)]"
        >
          Go to profile
          <IconArrowRight size={16} stroke={1.5} aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3 border-t border-[var(--color-cs-border)] pt-5">
      <PlaidConnectButton beneficiaryId={beneficiaryId} onConnected={advanceToBenefits} />
      <p className="text-center text-[13px] text-[var(--color-cs-text-secondary)]">
        Not ready?{" "}
        <button
          type="button"
          onClick={skip}
          disabled={loading}
          className="font-medium text-[var(--color-cs-brand)] hover:underline disabled:opacity-50"
        >
          Skip for now
        </button>{" "}
        — you can connect from Accounts later.
      </p>
    </div>
  );
}
