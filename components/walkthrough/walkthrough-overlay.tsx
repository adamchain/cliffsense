"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useWalkthrough } from "./walkthrough-provider";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 4;

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
    height: Math.min(window.innerHeight - 8, r.height + PAD * 2),
  };
}

/** Soft dim panels — target stays at natural size, no scroll/zoom. */
function DimAround({ rect, onDismiss }: { rect: Rect; onDismiss: () => void }) {
  const { top, left, width, height } = rect;
  const dim = "absolute bg-black/25";
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
      {/* Hairline frame only — no thick ring / scale that reads as zoom */}
      <div
        className="pointer-events-none absolute rounded-[14px]"
        style={{
          top,
          left,
          width,
          height,
          boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.95)",
        }}
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
        <div className="absolute inset-0 bg-black/25" onClick={skip} aria-hidden />
      )}

      {/* Dark glass tip — contrasts with light app surfaces being highlighted */}
      <div
        className="cs-safe-bottom pointer-events-auto fixed inset-x-0 bottom-0 z-[1] flex justify-center px-4 pb-4 pt-2 sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full max-w-[400px] rounded-[22px] border border-white/12 px-4 py-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
          style={{
            background: "rgba(28, 28, 30, 0.92)",
            backdropFilter: "saturate(180%) blur(28px)",
            WebkitBackdropFilter: "saturate(180%) blur(28px)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5" aria-hidden>
              {Array.from({ length: total }, (_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === stepIndex ? "w-3.5 bg-white" : "w-1 bg-white/30"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={skip}
              className="text-[13px] font-medium text-white/55 hover:text-white/85"
            >
              Skip
            </button>
          </div>

          <h2
            id="walkthrough-title"
            className="mt-3 text-[17px] font-semibold tracking-[-0.2px] text-white"
          >
            {step.title}
          </h2>
          <p className="mt-1 text-[14px] leading-[1.35] text-white/65">{step.body}</p>

          <div className="mt-3.5 flex items-center justify-end gap-2">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={back}
                className="rounded-full bg-white/12 px-3.5 py-1.5 text-[13px] font-semibold text-white/90 hover:bg-white/18"
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
