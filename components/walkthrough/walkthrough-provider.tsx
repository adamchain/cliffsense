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
    /* non-blocking */
  }
}

function needsNav(pathname: string, href: string | null) {
  if (!href) return false;
  return pathname !== href && !pathname.startsWith(`${href}/`);
}

export function WalkthroughProvider({
  children,
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

  const goToStep = useCallback(
    (idx: number) => {
      const s = WALKTHROUGH_STEPS[idx];
      if (!s) return;
      setStepIndex(idx);
      if (needsNav(pathname, s.href)) {
        router.push(s.href!);
      }
    },
    [pathname, router],
  );

  const start = useCallback(() => {
    setActive(true);
    void persistCompleted(false);
    goToStep(0);
  }, [goToStep]);

  const next = useCallback(() => {
    if (stepIndex >= total - 1) {
      void finish();
      return;
    }
    goToStep(stepIndex + 1);
  }, [finish, goToStep, stepIndex, total]);

  const back = useCallback(() => {
    if (stepIndex <= 0) return;
    goToStep(stepIndex - 1);
  }, [goToStep, stepIndex]);

  const skip = useCallback(() => {
    void finish();
  }, [finish]);

  useEffect(() => {
    if (autoTried || !shouldAutoStart || active) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/application")) return;
    setAutoTried(true);
    const t = window.setTimeout(() => {
      setActive(true);
      const first = WALKTHROUGH_STEPS[0];
      if (first?.href && needsNav(pathname, first.href)) {
        router.push(first.href);
      }
    }, 700);
    return () => window.clearTimeout(t);
  }, [active, autoTried, pathname, router, shouldAutoStart]);

  // If the active step requires a route we aren't on yet (e.g. refresh mid-tour), navigate.
  useEffect(() => {
    if (!active || !step?.href) return;
    if (needsNav(pathname, step.href)) {
      router.push(step.href);
    }
  }, [active, pathname, router, step]);

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
