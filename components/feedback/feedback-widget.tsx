"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { IconMessageDots, IconX } from "@tabler/icons-react";

export function FeedbackWidget() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (open && !done) {
      textareaRef.current?.focus();
    }
  }, [open, done]);

  function close() {
    setOpen(false);
    setError(null);
    if (done) {
      setDone(false);
      setMessage("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Please enter a short message.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, path: pathname }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      setMessage("");
    } catch {
      setError("Could not send. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[45] flex flex-col items-end gap-3 lg:bottom-6 lg:right-6">
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="pointer-events-auto w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-[var(--color-cs-border)] bg-white shadow-[var(--shadow-cs-float)]"
        >
          <header className="flex items-center justify-between border-b border-[var(--color-cs-border)] px-4 py-3">
            <h2 id={titleId} className="text-[15px] font-semibold text-[var(--color-cs-text)]">
              Send feedback
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close feedback"
              className="rounded-lg p-1 text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-text)]"
            >
              <IconX size={18} stroke={1.7} />
            </button>
          </header>

          {done ? (
            <div className="px-4 py-5">
              <p className="text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
                Thanks — we received your note.
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-4 w-full rounded-xl bg-[var(--color-cs-brand)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-cs-brand-hover)]"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4 py-4">
              <label className="sr-only" htmlFor="feedback-message">
                Your feedback
              </label>
              <textarea
                id="feedback-message"
                ref={textareaRef}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What’s working, what’s confusing, or what you’d like next…"
                className="w-full resize-none rounded-xl border border-[var(--color-cs-input-border)] bg-[var(--color-cs-surface)] px-3 py-2.5 text-[13px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)] focus:bg-white"
                maxLength={4000}
              />
              {error && <p className="text-xs text-[var(--color-cs-danger)]">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[var(--color-cs-brand)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send"}
              </button>
            </form>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={open ? "Close feedback" : "Send feedback"}
        aria-expanded={open}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-cs-brand)] text-white shadow-[var(--shadow-cs-float)] hover:bg-[var(--color-cs-brand-hover)]"
      >
        {open ? <IconX size={24} stroke={1.8} /> : <IconMessageDots size={24} stroke={1.8} />}
      </button>
    </div>
  );
}
