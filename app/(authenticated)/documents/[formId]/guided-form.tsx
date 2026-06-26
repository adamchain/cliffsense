"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconArrowBackUp,
  IconArrowRight,
  IconCheck,
  IconDownload,
  IconListDetails,
  IconPlayerSkipForward,
  IconPrinter,
  IconSparkles,
} from "@tabler/icons-react";
import type { FillableFormDef, FormFieldDef } from "@/lib/forms/types";
import { displayValue } from "@/lib/forms/format";

type Step = { field: FormFieldDef; section: string };

/** The question text shown in the chat — friendly phrasing when provided. */
function questionFor(field: FormFieldDef): string {
  return field.question ?? field.label;
}

/** Bubbles, chips, and a type-aware composer that walk the user through a form
 *  one question at a time, like a chat. Values are owned by the parent so the
 *  guided and classic views stay in sync. */
export function GuidedForm({
  form,
  values,
  onChange,
  prefilled,
  onDownload,
  downloading,
  onPrint,
  onReviewFull,
}: {
  form: FillableFormDef;
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  prefilled: Set<string>;
  onDownload: () => void;
  downloading: boolean;
  onPrint: () => void;
  onReviewFull: () => void;
}) {
  const steps = useMemo<Step[]>(
    () =>
      form.sections.flatMap((s) => s.fields.map((field) => ({ field, section: s.title }))),
    [form],
  );

  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [index, done]);

  const total = steps.length;
  const current = steps[index];
  const answered = index; // everything before the cursor has been seen

  function go(next: number) {
    if (next >= total) {
      setDone(true);
      return;
    }
    setDone(false);
    setIndex(Math.max(0, next));
  }

  function commit(name: string, value: string) {
    onChange(name, value);
    go(index + 1);
  }

  // ---- Done / summary screen -------------------------------------------------
  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <ChatRow who="bot">
          <div className="flex items-center gap-2 font-semibold text-[var(--color-cs-text)]">
            <IconCheck size={18} stroke={2.2} className="text-[var(--color-cs-success)]" aria-hidden />
            All set — here&apos;s your {form.title}.
          </div>
          <p className="mt-1 text-[13px] text-[var(--color-cs-text-secondary)]">
            Review the answers below, then download or print. Use the official link to actually submit.
          </p>
        </ChatRow>

        <section className="cs-card p-5">
          {form.sections.map((section) => (
            <div key={section.title} className="mb-4 last:mb-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
                {section.title}
              </div>
              <dl className="mt-2 divide-y divide-[var(--color-cs-border)]">
                {section.fields.map((field) => (
                  <div key={field.name} className="flex items-baseline justify-between gap-3 py-1.5">
                    <dt className="text-[12px] text-[var(--color-cs-text-secondary)]">{field.label}</dt>
                    <dd className="text-right text-[13px] font-medium text-[var(--color-cs-text)]">
                      {displayValue(field, values[field.name] ?? "")}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-cs-brand)] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
          >
            <IconDownload size={16} stroke={1.8} aria-hidden />
            {downloading ? "Preparing…" : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-cs-border)] px-3.5 py-2 text-[13px] font-semibold text-[var(--color-cs-text)] hover:bg-[var(--color-cs-nav-hover)]"
          >
            <IconPrinter size={16} stroke={1.8} aria-hidden />
            Print
          </button>
          <button
            type="button"
            onClick={onReviewFull}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-cs-border)] px-3.5 py-2 text-[13px] font-semibold text-[var(--color-cs-text)] hover:bg-[var(--color-cs-nav-hover)]"
          >
            <IconListDetails size={16} stroke={1.8} aria-hidden />
            Review full form
          </button>
          <button
            type="button"
            onClick={() => go(total - 1)}
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[13px] font-semibold text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-brand)]"
          >
            <IconArrowBackUp size={16} stroke={1.8} aria-hidden />
            Edit answers
          </button>
        </div>
        <div ref={bottomRef} />
      </div>
    );
  }

  // ---- Active conversation ---------------------------------------------------
  const showSectionHeader =
    index === 0 || steps[index - 1]?.section !== current.section;

  return (
    <div className="flex flex-col gap-3">
      {/* Progress */}
      <div className="sticky top-16 z-10 -mx-1 mb-1 rounded-xl bg-white/85 px-1 py-1 backdrop-blur">
        <div className="flex items-center justify-between text-[11px] font-medium text-[var(--color-cs-text-secondary)]">
          <span>{current.section}</span>
          <span className="tabular-nums">
            {index + 1} of {total}
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-cs-surface)]">
          <div
            className="h-full rounded-full bg-[var(--color-cs-brand)] transition-all"
            style={{ width: `${Math.round((index / total) * 100)}%` }}
          />
        </div>
      </div>

      <ChatRow who="bot">
        <p className="text-[13px] text-[var(--color-cs-text-secondary)]">
          I&apos;ll ask a few questions and fill out your {form.title}. Tap an answer or type — you can
          go back or switch to the full form anytime.
        </p>
      </ChatRow>

      {/* Recap of answered steps */}
      {steps.slice(0, answered).map((s, i) => {
        const val = values[s.field.name] ?? "";
        return (
          <div key={s.field.name} className="flex flex-col gap-1.5">
            <ChatRow who="bot" muted>
              <span className="text-[12px] text-[var(--color-cs-text-secondary)]">{questionFor(s.field)}</span>
            </ChatRow>
            <ChatRow who="user">
              <button
                type="button"
                onClick={() => go(i)}
                className="text-left text-[13px] font-medium underline-offset-2 hover:underline"
                title="Edit this answer"
              >
                {val.trim() ? displayValue(s.field, val) : "Skipped"}
              </button>
            </ChatRow>
          </div>
        );
      })}

      {/* Current question */}
      {showSectionHeader ? (
        <div className="mt-1 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
          {current.section}
        </div>
      ) : null}
      <ChatRow who="bot">
        <p className="text-[14px] font-semibold text-[var(--color-cs-text)]">{questionFor(current.field)}</p>
        {current.field.help ? (
          <p className="mt-1 text-[12px] text-[var(--color-cs-text-secondary)]">{current.field.help}</p>
        ) : null}
        {prefilled.has(current.field.name) && (values[current.field.name] ?? "").trim() ? (
          <p className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-[var(--color-cs-brand-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-cs-brand)]">
            <IconSparkles size={12} stroke={2} aria-hidden />
            Pulled from your data — edit if needed
          </p>
        ) : null}
      </ChatRow>

      <Composer
        key={current.field.name}
        field={current.field}
        value={values[current.field.name] ?? ""}
        onCommit={(v) => commit(current.field.name, v)}
        onBack={index > 0 ? () => go(index - 1) : undefined}
      />

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={onReviewFull}
          className="text-[12px] font-semibold text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-brand)]"
        >
          Prefer a full form? Switch to classic view
        </button>
      </div>
      <div ref={bottomRef} />
    </div>
  );
}

/** A left (assistant) or right (user) aligned chat bubble. */
function ChatRow({
  who,
  muted,
  children,
}: {
  who: "bot" | "user";
  muted?: boolean;
  children: React.ReactNode;
}) {
  if (who === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--color-cs-brand)] px-3.5 py-2 text-white shadow-[var(--shadow-cs-card)]">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div
        className={`max-w-[88%] rounded-2xl rounded-bl-sm px-3.5 py-2 ${
          muted
            ? "bg-transparent px-0 py-0"
            : "bg-white shadow-[var(--shadow-cs-card)] ring-1 ring-[var(--color-cs-border)]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/** The type-aware answer area pinned under the current question. */
function Composer({
  field,
  value,
  onCommit,
  onBack,
}: {
  field: FormFieldDef;
  value: string;
  onCommit: (value: string) => void;
  onBack?: () => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value, field.name]);

  const required = !!field.required;

  // Click-to-select for choices.
  if (field.type === "select" || field.type === "checkbox") {
    const options =
      field.type === "checkbox"
        ? [
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]
        : (field.options ?? []);
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap justify-end gap-2">
          {options.map((o) => {
            const selected = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onCommit(o.value)}
                className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                  selected
                    ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-brand)] text-white"
                    : "border-[var(--color-cs-border)] bg-white text-[var(--color-cs-text)] hover:border-[var(--color-cs-brand)] hover:text-[var(--color-cs-brand)]"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <ComposerActions onBack={onBack} />
      </div>
    );
  }

  const isMultiline = field.type === "textarea";
  const inputType =
    field.type === "currency" || field.type === "number"
      ? "number"
      : field.type === "date"
        ? "date"
        : field.type === "tel"
          ? "tel"
          : field.type === "email"
            ? "email"
            : "text";
  const canSend = !required || draft.trim() !== "";

  function send() {
    if (!canSend) return;
    onCommit(draft);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          {field.type === "currency" ? (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--color-cs-text-secondary)]">
              $
            </span>
          ) : null}
          {isMultiline ? (
            <textarea
              autoFocus
              rows={3}
              value={draft}
              placeholder={field.placeholder ?? "Type your answer…"}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") send();
              }}
              className="w-full rounded-2xl border border-[var(--color-cs-border)] bg-white px-3.5 py-2.5 text-[14px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)]"
            />
          ) : (
            <input
              autoFocus
              type={inputType}
              inputMode={field.type === "currency" ? "decimal" : undefined}
              step={field.type === "currency" ? "0.01" : undefined}
              value={draft}
              placeholder={field.placeholder ?? "Type your answer…"}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
              }}
              className={`w-full rounded-2xl border border-[var(--color-cs-border)] bg-white py-2.5 text-[14px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)] ${
                field.type === "currency" ? "pl-7 pr-3.5" : "px-3.5"
              }`}
            />
          )}
        </div>
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          className="inline-flex h-[42px] shrink-0 items-center gap-1.5 rounded-2xl bg-[var(--color-cs-brand)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-40"
        >
          <IconArrowRight size={16} stroke={2} aria-hidden />
          Send
        </button>
      </div>
      <ComposerActions
        onBack={onBack}
        onSkip={!required ? () => onCommit(draft.trim() ? draft : "") : undefined}
        skipKeepsValue={!!value.trim()}
      />
      {isMultiline ? (
        <p className="text-right text-[10px] text-[var(--color-cs-text-muted)]">⌘/Ctrl + Enter to send</p>
      ) : null}
    </div>
  );
}

function ComposerActions({
  onBack,
  onSkip,
  skipKeepsValue,
}: {
  onBack?: () => void;
  onSkip?: () => void;
  skipKeepsValue?: boolean;
}) {
  if (!onBack && !onSkip) return null;
  return (
    <div className="flex items-center justify-end gap-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-brand)]"
        >
          <IconArrowBackUp size={14} stroke={1.8} aria-hidden />
          Back
        </button>
      ) : null}
      {onSkip ? (
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-brand)]"
        >
          {skipKeepsValue ? <IconCheck size={14} stroke={1.8} aria-hidden /> : <IconPlayerSkipForward size={14} stroke={1.8} aria-hidden />}
          {skipKeepsValue ? "Keep & continue" : "Skip"}
        </button>
      ) : null}
    </div>
  );
}
