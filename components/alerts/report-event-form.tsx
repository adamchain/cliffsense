"use client";

import { useEffect, useState } from "react";

type Option = { id: string; title: string; risk: string };

export function ReportEventForm({
  beneficiaryId,
  onCreated,
}: {
  beneficiaryId: string;
  onCreated: () => void;
}) {
  const [options, setOptions] = useState<Option[]>([]);
  const [scenarioId, setScenarioId] = useState("");
  const [noticeDeadline, setNoticeDeadline] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/alerts/report?beneficiaryId=${encodeURIComponent(beneficiaryId)}`)
      .then((res) => res.json())
      .then((data: { scenarios?: Option[] }) => {
        if (cancelled) return;
        const rows = data.scenarios ?? [];
        setOptions(rows);
        setScenarioId(rows[0]?.id ?? "");
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [beneficiaryId]);

  const selected = options.find((option) => option.id === scenarioId);

  if (options.length === 0) return null;

  return (
    <form
      className="mb-5 rounded-xl border border-[var(--color-cs-border)] bg-white/70 px-3 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        setInfo(null);
        void fetch("/api/alerts/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            beneficiaryId,
            scenarioId,
            note: note.trim() || undefined,
            noticeDeadline: noticeDeadline || undefined,
          }),
        })
          .then(async (res) => {
            const data = (await res.json().catch(() => ({}))) as { error?: string; alreadyOpen?: boolean };
            if (!res.ok) {
              setError(data.error ?? "Could not open a case");
              return;
            }
            setInfo(data.alreadyOpen ? "That case is already open." : "Case opened.");
            setNote("");
            setNoticeDeadline("");
            onCreated();
          })
          .catch(() => setError("Could not open a case"))
          .finally(() => setBusy(false));
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
        Report an event
      </p>
      <p className="mt-1 text-[13px] leading-snug text-[var(--color-cs-text-secondary)]">
        Use this for a change the bank feed cannot see. It opens the same case as an automatic alert.
      </p>
      <label className="mt-2 block text-[13px] text-[var(--color-cs-text-secondary)]">
        Event
        <select
          className="cs-input mt-1"
          value={scenarioId}
          onChange={(event) => setScenarioId(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
            </option>
          ))}
        </select>
      </label>
      {selected && <p className="mt-1 text-[12px] leading-snug text-[var(--color-cs-text-muted)]">{selected.risk}</p>}
      <label className="mt-2 block text-[13px] text-[var(--color-cs-text-secondary)]">
        Date on a notice, if you have one
        <input
          type="date"
          className="cs-input mt-1"
          value={noticeDeadline}
          onChange={(event) => setNoticeDeadline(event.target.value)}
        />
      </label>
      <label className="mt-2 block text-[13px] text-[var(--color-cs-text-secondary)]">
        What happened
        <textarea
          className="cs-input mt-1 min-h-16"
          value={note}
          maxLength={1000}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <button type="submit" className="cs-acard-btn cs-acard-btn-primary mt-2" disabled={busy || !scenarioId}>
        Open case
      </button>
      {error && <p className="mt-2 text-[12px] text-[var(--color-cs-danger)]">{error}</p>}
      {info && <p className="mt-2 text-[12px] text-[var(--color-cs-text-secondary)]">{info}</p>}
    </form>
  );
}
