"use client";

import { useState } from "react";

export function StayUpdatedForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), notes: notes.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError((j as { error?: string }).error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Could not submit. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="w-full rounded-lg border border-[var(--color-cs-border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-[var(--color-cs-text)]">You&apos;re on the list</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
          Thank you. We&apos;ll be in touch as MyBenefitsPA becomes available.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-[var(--color-cs-border)] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-[var(--color-cs-text)]">Stay updated</h2>
      <p className="mt-1 text-[13px] text-[var(--color-cs-text-secondary)]">
        We&apos;re building MyBenefitsPA. Leave your info and we&apos;ll reach out when it&apos;s ready.
      </p>
      <form className="mt-5 flex flex-col gap-3.5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-cs-text)]" htmlFor="su-name">
            Name
          </label>
          <input
            id="su-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="h-9 w-full rounded-sm border border-[var(--color-cs-input-border)] border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 text-[13px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-cs-text)]" htmlFor="su-email">
            Email address
          </label>
          <input
            id="su-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-9 w-full rounded-sm border border-[var(--color-cs-input-border)] border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 text-[13px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-cs-text)]" htmlFor="su-notes">
            Notes <span className="font-normal text-[var(--color-cs-text-muted)]">(optional)</span>
          </label>
          <textarea
            id="su-notes"
            name="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tell us about your situation or what you're hoping to track…"
            className="w-full resize-none rounded-sm border border-[var(--color-cs-input-border)] border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 py-2 text-[13px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
          />
        </div>
        {error && <p className="text-xs text-[var(--color-cs-danger)]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-sm bg-[var(--color-cs-brand)] py-2.5 text-sm font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Keep me posted"}
        </button>
      </form>
    </div>
  );
}
