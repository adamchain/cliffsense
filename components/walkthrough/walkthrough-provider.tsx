"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { WALKTHROUGH_STEPS, type WalkthroughStep } from "@/lib/walkthrough/steps";
import { WalkthroughOverlay } from "./walkthrough-overlay";

type WalkthroughContextValue = {
  active: boolean;
  stepIndex: number;
  step: WalkthroughStep | null;
  total: number;
  start: () => void;
  next: () => void;
  back: () => void;
  skip: () => void;
};

const WalkthroughContext = createContext<WalkthroughContextValue | null>(null);

export function useWalkthrough() {
  const ctx = useContext(WalkthroughContext);
  if (!ctx) {
    throw new Error("useWalkthrough must be used within WalkthroughProvider");
  }
  return ctx;
}

/** Safe hook for optional consumers (e.g. Help button outside provider). */
export function useWalkthroughOptional() {
  return useContext(WalkthroughContext);
}

async function persistCompleted(done: boolean) {
  try {
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walkthroughCompleted: done }),
    });
  } catch {
    /* non-blocking — local UX still works */
  }
}

export function WalkthroughProvider({
  children,
  /** True when the user has never finished/skipped the tour. */
  shouldAutoStart,
}: {
  children: ReactNode;
  shouldAutoStart: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [autoTried, setAutoTried] = useState(false);

  const step = active ? (WALKTHROUGH_STEPS[stepIndex] ?? null) : null;
  const total = WALKTHROUGH_STEPS.length;

  const finish = useCallback(async () => {
    setActive(false);
    setStepIndex(0);
    await persistCompleted(true);
  }, []);

  const start = useCallback(() => {
    setStepIndex(0);
    setActive(true);
    void persistCompleted(false);
    const first = WALKTHROUGH_STEPS[0];
    if (first?.href && pathname !== first.href) {
      router.push(first.href);
    }
  }, [pathname, router]);

  const next = useCallback(() => {
    if (stepIndex >= total - 1) {
      void finish();
      return;
    }
    const nextIdx = stepIndex + 1;
    const nextStep = WALKTHROUGH_STEPS[nextIdx];
    setStepIndex(nextIdx);
    if (nextStep?.href && !pathname.startsWith(nextStep.href)) {
      router.push(nextStep.href);
    }
  }, [finish, pathname, router, stepIndex, total]);

  const back = useCallback(() => {
    if (stepIndex <= 0) return;
    const prevIdx = stepIndex - 1;
    const prevStep = WALKTHROUGH_STEPS[prevIdx];
    setStepIndex(prevIdx);
    if (prevStep?.href && !pathname.startsWith(prevStep.href)) {
      router.push(prevStep.href);
    }
  }, [pathname, router, stepIndex]);

  const skip = useCallback(() => {
    void finish();
  }, [finish]);

  // Auto-start once for users who finished onboarding but never did the tour.
  // Skip admin surfaces and wait a beat so the shell paints first.
  useEffect(() => {
    if (autoTried || !shouldAutoStart || active) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/application")) return;
    setAutoTried(true);
    const t = window.setTimeout(() => {
      setStepIndex(0);
      setActive(true);
      const first = WALKTHROUGH_STEPS[0];
      if (first?.href && pathname !== first.href) {
        router.push(first.href);
      }
    }, 700);
    return () => window.clearTimeout(t);
  }, [active, autoTried, pathname, router, shouldAutoStart]);

  // Keep navigation in sync when the user lands on a step's route late.
  useEffect(() => {
    if (!active || !step?.href) return;
    if (!pathname.startsWith(step.href) && step.href !== pathname) {
      // Allow a short window for router.push from next/back to settle.
    }
  }, [active, pathname, step]);

  const value = useMemo(
    () => ({ active, stepIndex, step, total, start, next, back, skip }),
    [active, stepIndex, step, total, start, next, back, skip],
  );

  return (
    <WalkthroughContext.Provider value={value}>
      {children}
      {active && step ? <WalkthroughOverlay /> : null}
    </WalkthroughContext.Provider>
  );
}
