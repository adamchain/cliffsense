"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconX } from "@tabler/icons-react";
import { useWalkthrough } from "./walkthrough-provider";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;

function measureTarget(id: string | null): Rect | null {
  if (!id || typeof document === "undefined") return null;
  const el = document.querySelector(`[data-tour="${id}"]`) as HTMLElement | null;
  if (!el) return null;
  el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  const r = el.getBoundingClientRect();
  if (r.width < 2 && r.height < 2) return null;
  return {
    top: Math.max(8, r.top - PAD),
    left: Math.max(8, r.left - PAD),
    width: Math.min(window.innerWidth - 16, r.width + PAD * 2),
    height: Math.min(window.innerHeight - 16, r.height + PAD * 2),
  };
}

function cardStyle(rect: Rect | null): React.CSSProperties {
  const width = "min(420px, calc(100vw - 2rem))";
  if (!rect) {
    return {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width,
    };
  }
  const spaceBelow = window.innerHeight - (rect.top + rect.height);
  const preferBelow = spaceBelow > 240 || rect.top < 160;
  const left = Math.min(
    Math.max(16, rect.left),
    window.innerWidth - Math.min(420, window.innerWidth - 32) - 16,
  );
  if (preferBelow) {
    return {
      position: "fixed",
      left,
      top: Math.min(rect.top + rect.height + 14, window.innerHeight - 240),
      width,
    };
  }
  return {
    position: "fixed",
    left,
    bottom: Math.max(16, window.innerHeight - rect.top + 14),
    width,
  };
}

/** Four dim panels around the spotlight hole so the target stays clickable. */
function DimAround({ rect, onDismiss }: { rect: Rect; onDismiss: () => void }) {
  const { top, left, width, height } = rect;
  const common = "absolute bg-[rgba(15,27,51,0.55)]";
  return (
    <>
      <div className={common} style={{ top: 0, left: 0, right: 0, height: top }} onClick={onDismiss} />
      <div
        className={common}
        style={{ top: top + height, left: 0, right: 0, bottom: 0 }}
        onClick={onDismiss}
      />
      <div
        className={common}
        style={{ top, left: 0, width: left, height }}
        onClick={onDismiss}
      />
      <div
        className={common}
        style={{ top, left: left + width, right: 0, height }}
        onClick={onDismiss}
      />
      <div
        className="pointer-events-none absolute rounded-[16px] ring-2 ring-[var(--color-cs-brand)] ring-offset-2 ring-offset-transparent"
        style={{ top, left, width, height }}
      />
    </>
  );
}

export function WalkthroughOverlay() {
  const { step, stepIndex, total, next, back, skip } = useWalkthrough();
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!step) return;
    let cancelled = false;
    let tries = 0;
    let timer = 0;

    const tick = () => {
      if (cancelled) return;
      const measured = measureTarget(step.target);
      setRect(measured);
      if (!measured && step.target && tries < 25) {
        tries += 1;
        timer = window.setTimeout(tick, 100);
      }
    };

    tick();
    const onResize = () => setRect(measureTarget(step.target));
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [step]);

  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skip();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, next, back, skip]);

  if (!mounted || !step) return null;

  const isLast = stepIndex >= total - 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[200]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-title"
    >
      {rect ? (
        <DimAround rect={rect} onDismiss={skip} />
      ) : (
        <div className="absolute inset-0 bg-[rgba(15,27,51,0.55)]" onClick={skip} aria-hidden />
      )}

      <div
        className="rounded-[18px] border border-[var(--color-cs-border)] bg-white p-5 shadow-[var(--shadow-cs-float)]"
        style={cardStyle(rect)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--color-cs-brand)]">
              Step {stepIndex + 1} of {total}
            </p>
            <h2
              id="walkthrough-title"
              className="mt-1 text-[18px] font-bold tracking-tight text-[var(--color-cs-text)]"
            >
              {step.title}
            </h2>
          </div>
          <button type="button" onClick={skip} className="cs-circbtn shrink-0" aria-label="Skip tour">
            <IconX size={16} stroke={1.8} />
          </button>
        </div>
        <p className="text-[14px] leading-relaxed text-[var(--color-cs-text-secondary)]">{step.body}</p>

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={skip}
            className="text-[13px] font-semibold text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-text)]"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={back}
                className="cs-btn cs-btn-secondary !px-4 !py-2 !text-[13px]"
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={next}
              className="cs-btn cs-btn-primary !px-4 !py-2 !text-[13px]"
            >
              {isLast ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
