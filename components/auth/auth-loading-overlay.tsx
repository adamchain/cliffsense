type AuthLoadingOverlayProps = {
  title: string;
  subtitle?: string;
};

/**
 * Full-viewport overlay for account flows (register, sign-in).
 * Uses global `.cs-auth-spinner` / `.cs-auth-bar-fill` in globals.css.
 */
export function AuthLoadingOverlay({ title, subtitle }: AuthLoadingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-[var(--color-cs-surface)]/88 px-6 backdrop-blur-[3px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-11 w-11">
          <div
            className="absolute inset-0 rounded-full border-2 border-[var(--color-cs-border)] opacity-[0.65]"
            aria-hidden
          />
          <div
            className="cs-auth-spinner absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--color-cs-brand)] border-r-[#2b579755]"
            aria-hidden
          />
        </div>
        <div className="max-w-[280px] text-center">
          <p className="text-[15px] font-medium tracking-tight text-[var(--color-cs-text)]">{title}</p>
          {subtitle ? (
            <p className="mt-1.5 text-[13px] leading-snug text-[var(--color-cs-text-secondary)]">{subtitle}</p>
          ) : null}
        </div>
        <div
          className="cs-auth-bar-track h-[3px] w-[min(220px,70vw)] rounded-full bg-[var(--color-cs-border)]"
          aria-hidden
        >
          <div className="cs-auth-bar-fill" />
        </div>
      </div>
    </div>
  );
}
