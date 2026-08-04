/** Stylized seals for wallet cards — not official government artwork. */

export function SsaSeal({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <path id="ssaTop" d="M8 50 A42 42 0 0 1 92 50" />
        <path id="ssaBot" d="M9 50 A41 41 0 0 0 91 50" />
      </defs>
      <circle cx="50" cy="50" r="47" strokeWidth="2" />
      <circle cx="50" cy="50" r="37.5" strokeWidth="1" />
      <text
        fontSize="8.4"
        fontWeight="600"
        letterSpacing="1.3"
        fill="currentColor"
        stroke="none"
      >
        <textPath href="#ssaTop" startOffset="50%" textAnchor="middle">
          SOCIAL SECURITY
        </textPath>
      </text>
      <text
        fontSize="7.8"
        fontWeight="600"
        letterSpacing="1.1"
        fill="currentColor"
        stroke="none"
      >
        <textPath href="#ssaBot" startOffset="50%" textAnchor="middle">
          ADMINISTRATION
        </textPath>
      </text>
      <path
        d="M50 33 L64 38.5 V54 C64 63 57 67 50 70 C43 67 36 63 36 54 V38.5 Z"
        strokeWidth="1.8"
      />
      <rect x="36" y="38.5" width="28" height="7.2" strokeWidth="1.2" />
      <text
        x="50"
        y="44.4"
        textAnchor="middle"
        fontSize="6"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        USA
      </text>
      <g strokeWidth="1.4" strokeLinecap="round">
        <line x1="41" y1="49" x2="41" y2="63" />
        <line x1="45.5" y1="49" x2="45.5" y2="64.6" />
        <line x1="50" y1="49" x2="50" y2="66" />
        <line x1="54.5" y1="49" x2="54.5" y2="64.6" />
        <line x1="59" y1="49" x2="59" y2="63" />
      </g>
    </svg>
  );
}

/** Soft filled keystone — no red outline. Uses currentColor for card theming. */
export function PaKeystoneMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M20 30 C36 22 64 22 80 30 L70 82 C58 86 42 86 30 82 Z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M26 34 C40 28 60 28 74 34 L66 78 C56 81 44 81 34 78 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <text
        x="50"
        y="64"
        textAnchor="middle"
        fontSize="28"
        fontWeight="800"
        fill="currentColor"
        letterSpacing="-1"
        fontFamily="var(--font-sans), system-ui, sans-serif"
        opacity="0.85"
      >
        PA
      </text>
    </svg>
  );
}

/** Compact keystone chip for card headers. */
export function PaKeystoneChip({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 18 16"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M2.5 3.2 C6.5 1.2 11.5 1.2 15.5 3.2 L13.2 13.2 C10.2 14.4 7.8 14.4 4.8 13.2 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function UsFlagMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 26 16"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="26" height="16" rx="2" fill="#fff" />
      <g fill="#b22234">
        <rect y="0" width="26" height="1.23" />
        <rect y="2.46" width="26" height="1.23" />
        <rect y="4.92" width="26" height="1.23" />
        <rect y="7.38" width="26" height="1.23" />
        <rect y="9.84" width="26" height="1.23" />
        <rect y="12.3" width="26" height="1.23" />
        <rect y="14.76" width="26" height="1.23" />
      </g>
      <rect width="11" height="8.6" fill="#3c3b6e" />
      <g fill="#fff">
        <circle cx="2.4" cy="1.9" r=".7" />
        <circle cx="5.5" cy="1.9" r=".7" />
        <circle cx="8.6" cy="1.9" r=".7" />
        <circle cx="3.9" cy="4.3" r=".7" />
        <circle cx="7" cy="4.3" r=".7" />
        <circle cx="2.4" cy="6.7" r=".7" />
        <circle cx="5.5" cy="6.7" r=".7" />
        <circle cx="8.6" cy="6.7" r=".7" />
      </g>
    </svg>
  );
}
