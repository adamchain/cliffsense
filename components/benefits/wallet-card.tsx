import Link from "next/link";
import {
  IconBriefcase,
  IconCurrencyDollar,
  IconHeart,
  IconHome,
  IconLeaf,
} from "@tabler/icons-react";
import type { ProgramCardModel } from "@/lib/benefits/program-tier";
import { formatUsdCents } from "@/lib/benefits/program-tier";
import { PaKeystoneChip, PaKeystoneMark, SsaSeal, UsFlagMark } from "./wallet-seals";

const PILL: Record<ProgramCardModel["status"], string> = {
  ok: "#1f9d4d",
  warn: "#cf7a12",
  crit: "#c0392b",
};
const BAR: Record<ProgramCardModel["status"], string> = {
  ok: "#34d15f",
  warn: "#ffab2e",
  crit: "#ff5a4f",
};

function ProgramGlyph({ code, federal }: { code: string; federal: boolean }) {
  const color = federal ? "#fff" : "#17294d";
  const props = { size: 22, stroke: 2, color, "aria-hidden": true as const };
  switch (code) {
    case "SSDI":
      return <IconBriefcase {...props} />;
    case "SNAP":
    case "WIC":
      return <IconLeaf {...props} />;
    case "MEDICAID":
      return <IconHeart {...props} fill={color} />;
    case "SECTION8":
    case "ABLE":
      return <IconHome {...props} />;
    default:
      return <IconCurrencyDollar {...props} />;
  }
}

export function WalletCard({ card }: { card: ProgramCardModel }) {
  const fed = card.tier === "federal";
  const big =
    card.currentCents != null ? formatUsdCents(card.currentCents) : "—";
  const sub =
    card.limitCents != null ? `of ${formatUsdCents(card.limitCents)}` : `${card.total} limit${card.total === 1 ? "" : "s"}`;
  const pct = card.pct != null ? Math.min(card.pct, 100) : 0;

  return (
    <Link
      href={`/thresholds/${card.code}`}
      className={`cs-wcard ${fed ? "cs-wcard--fed" : "cs-wcard--state"}`}
    >
      <div className="cs-wcard-seal" aria-hidden>
        {fed ? <SsaSeal /> : <PaKeystoneMark />}
      </div>
      <div className="cs-wcard-in">
        <div className="cs-wcard-top">
          <span className="cs-wcard-label">
            {fed ? (
              <UsFlagMark className="cs-fed-flag" />
            ) : (
              <PaKeystoneChip className="cs-pa-chip" />
            )}
            <span>{card.tag}</span>
          </span>
          <span className="cs-wcard-pill" style={{ background: PILL[card.status] }}>
            {card.word}
          </span>
        </div>
        <div className="cs-wcard-name">
          <ProgramGlyph code={card.code} federal={fed} />
          {card.label}
        </div>
        <div className="cs-wcard-bot">
          <div className="cs-wcard-num">
            {big}
            <span>{sub}</span>
          </div>
          <div className="cs-wcard-bar">
            <div
              className="cs-wcard-fill"
              style={{ width: `${pct}%`, background: BAR[card.status] }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function WalletCardGroup({
  title,
  countLabel,
  cards,
}: {
  title: string;
  countLabel: string;
  cards: ProgramCardModel[];
}) {
  if (cards.length === 0) return null;
  return (
    <section className="mb-1">
      <div className="cs-grp-h">
        <h2>{title}</h2>
        <span className="cs-grp-count">{countLabel}</span>
      </div>
      <div className="flex flex-col gap-3.5">
        {cards.map((c) => (
          <WalletCard key={c.code} card={c} />
        ))}
      </div>
    </section>
  );
}
