"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useWalkthrough } from "./walkthrough-provider";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 5;
/** Keep spotlights compact so tall columns don’t feel “zoomed”. */
const MAX_H = 280;

function measureTarget(id: string | null): Rect | null {
  if (!id || typeof document === "undefined") return null;
  const el = document.querySelector(`[data-tour="${id}"]`) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 && r.height < 2) return null;
  return {
    top: Math.max(4, r.top - PAD),
    left: Math.max(4, r.left - PAD),
    width: Math.min(window.innerWidth - 8, r.width + PAD * 2),
    height: Math.min(MAX_H, window.innerHeight - 16, r.height + PAD * 2),
  };
}

function DimAround({ rect, onDismiss }: { rect: Rect; onDismiss: () => void }) {
  const { top, left, width, height } = rect;
  const dim = "pointer-events-auto absolute bg-black/30";
  return (
    <>
      <div className={dim} style={{ top: 0, left: 0, right: 0, height: top }} onClick={onDismiss} />
      <div
        className={dim}
        style={{ top: top + height, left: 0, right: 0, bottom: 0 }}
        onClick={onDismiss}
      />
      <div className={dim} style={{ top, left: 0, width: left, height }} onClick={onDismiss} />
      <div
        className={dim}
        style={{ top, left: left + width, right: 0, height }}
        onClick={onDismiss}
      />
      <div
        className="pointer-events-none absolute rounded-[14px]"
        style={{
          top,
          left,
          width,
          height,
          boxShadow: "0 0 0 2px var(--color-cs-brand)",
        }}
      />
    </>
  );
}

/** Place tip near the spotlight without covering it — light frosted sheet (iOS tip). */
function tipStyle(rect: Rect | null): React.CSSProperties {
  const width = "min(360px, calc(100vw - 2rem))";
  if (!rect) {
    return {
      position: "fixed",
      left: "50%",
      bottom: "max(1.25rem, env(safe-area-inset-bottom))",
      transform: "translateX(-50%)",
      width,
    };
  }

  const tipH = 168;
  const gap = 12;
  const spaceBelow = window.innerHeight - (rect.top + rect.height);
  const spaceAbove = rect.top;
  const preferBelow = spaceBelow >= tipH + gap || spaceBelow >= spaceAbove;

  let left = Math.min(
    Math.max(16, rect.left),
    window.innerWidth - Math.min(360, window.innerWidth - 32) - 16,
  );

  if (preferBelow) {
    return {
      position: "fixed",
      left,
      top: Math.min(rect.top + rect.height + gap, window.innerHeight - tipH - 16),
      width,
    };
  }
  return {
    position: "fixed",
    left,
    top: Math.max(16, rect.top - tipH - gap),
    width,
  };
}

export function WalkthroughOverlay() {
  const { step, stepIndex, total, next, back, skip } = useWalkthrough();
  const pathname = usePathname() ?? "";
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
      if (step.target && !measured && tries < 40) {
        tries += 1;
        timer = window.setTimeout(tick, 75);
      }
    };

    setRect(null);
    tick();

    const onResize = () => setRect(measureTarget(step.target));
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    const observer = new MutationObserver(() => {
      if (cancelled || !step.target) return;
      const measured = measureTarget(step.target);
      if (measured) setRect(measured);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      observer.disconnect();
    };
  }, [step, pathname]);

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

  const style = useMemo(() => tipStyle(rect), [rect]);

  if (!mounted || !step) return null;

  const isLast = stepIndex >= total - 1;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[200]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-title"
    >
      {rect ? (
        <DimAround rect={rect} onDismiss={skip} />
      ) : (
        <div
          className="pointer-events-auto absolute inset-0 bg-black/30"
          onClick={skip}
          aria-hidden
        />
      )}

      {/* Light frosted tip — distinct from the blue-framed spotlight cutout */}
      <div
        className="pointer-events-auto z-[210]"
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-[18px] border border-black/8 px-4 py-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.18)]"
          style={{
            background: "rgba(242, 242, 247, 0.92)",
            backdropFilter: "saturate(180%) blur(24px)",
            WebkitBackdropFilter: "saturate(180%) blur(24px)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-semibold text-[var(--color-cs-brand)]">
              {stepIndex + 1} of {total}
            </p>
            <button
              type="button"
              onClick={skip}
              className="text-[13px] font-medium text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-text)]"
            >
              Skip
            </button>
          </div>

          <h2
            id="walkthrough-title"
            className="mt-1.5 text-[17px] font-semibold tracking-[-0.2px] text-[var(--color-cs-text)]"
          >
            {step.title}
          </h2>
          <p className="mt-1 text-[14px] leading-[1.35] text-[var(--color-cs-text-secondary)]">
            {step.body}
          </p>

          <div className="mt-3 flex items-center justify-end gap-2">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={back}
                className="rounded-full bg-black/6 px-3.5 py-1.5 text-[13px] font-semibold text-[var(--color-cs-text)] hover:bg-black/10"
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={next}
              className="rounded-full bg-[var(--color-cs-brand)] px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-[var(--color-cs-brand-hover)]"
            >
              {isLast ? "Done" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
