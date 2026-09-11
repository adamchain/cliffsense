"use client";

import { IconSend } from "@tabler/icons-react";

/** One-line ask field + send. Width is capped so it doesn’t stretch full page. */
export function AskComposer({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "Ask about your benefits",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex w-full max-w-xl items-center gap-2"
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={placeholder}
        className="h-10 min-w-0 flex-1 rounded-[20px] border border-[var(--color-cs-sep)] bg-[var(--color-cs-card)] px-3.5 text-[15px] text-[var(--color-cs-text)] outline-none placeholder:text-[var(--color-cs-text-muted)] focus:border-[var(--color-cs-brand)]"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[var(--color-cs-brand)] text-white disabled:opacity-50"
        aria-label="Send"
      >
        <IconSend size={16} stroke={2} aria-hidden />
      </button>
    </form>
  );
}
