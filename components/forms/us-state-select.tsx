import { US_STATES } from "@/lib/constants/us-states";

const selectClassName = "cs-input cursor-pointer";

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
