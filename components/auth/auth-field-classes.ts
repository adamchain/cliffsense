/** Fluent-style text fields for auth flows */
export const authTextInputClass =
  "h-9 w-full rounded-[2px] border border-[var(--color-cs-input-border)] bg-white px-3 text-sm text-[var(--color-cs-text)] shadow-[inset_0_-1px_0_0_var(--color-cs-input-bottom)] transition-[border-color,box-shadow] placeholder:text-[var(--color-cs-text-muted)] focus:border-[var(--color-cs-brand)] focus:shadow-[inset_0_-2px_0_0_var(--color-cs-brand)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cs-brand)]/20 focus-visible:ring-offset-0 disabled:bg-[var(--color-cs-nav-hover)] disabled:text-[var(--color-cs-text-muted)]";

export const authLabelClass = "text-xs font-semibold leading-snug text-[var(--color-cs-text)]";

export const authPrimaryButtonClass =
  "inline-flex h-10 w-full items-center justify-center rounded-[2px] bg-[var(--color-cs-brand)] text-sm font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.12)] transition-colors hover:bg-[var(--color-cs-brand-hover)] active:bg-[var(--color-cs-brand-hover)] disabled:pointer-events-none disabled:opacity-55";

export const authSecondaryButtonClass =
  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-[2px] border border-[var(--color-cs-input-border)] bg-white text-sm font-medium text-[var(--color-cs-text)] shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-colors hover:bg-[var(--color-cs-nav-hover)] disabled:pointer-events-none disabled:opacity-50";
