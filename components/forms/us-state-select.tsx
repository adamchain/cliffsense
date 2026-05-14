import { US_STATES } from "@/lib/constants/us-states";

const selectClassName =
  "h-8 w-full max-w-[280px] rounded-sm border border-[var(--color-cs-input-border)] border-b border-b-[var(--color-cs-input-bottom)] bg-white px-2 text-[13px] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2";

type UsStateSelectProps = {
  id: string;
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
};

export function UsStateSelect({ id, value, onChange, disabled }: UsStateSelectProps) {
  return (
    <select
      id={id}
      required
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={selectClassName}
    >
      <option value="" disabled>
        Select state…
      </option>
      {US_STATES.map(({ code, name }) => (
        <option key={code} value={code}>
          {code} — {name}
        </option>
      ))}
    </select>
  );
}
