import Link from "next/link";
import {
  IconBriefcase,
  IconCurrencyDollar,
  IconHeart,
  IconHome,
  IconLeaf,
} from "@tabler/icons-react";
import type { ProgramCardModel } from "@/lib/benefits/program-tier";
import { formatUsdCents, statusReassurance, wageReportPlace } from "@/lib/benefits/program-tier";
import { PaKeystoneMark, PaStateChip, SsaSeal, UsFlagMark } from "./wallet-seals";

const BAR: Record<ProgramCardModel["status"], string> = {
  ok: "#34d15f",
  warn: "#ffab2e",
  crit: "#ff5a4f",
};

const REASSURE: Record<ProgramCardModel["status"], string> = {
  ok: "#34d15f",
  warn: "#ffab2e",
  crit: "#ff8a80",
};

function ProgramGlyph({ code }: { code: string }) {
  const color = "#fff";
  const props = { size: 22, stroke: 2, color, "aria-hidden": true as const };
  switch (code) {
    case "SSDI":
      return <IconBriefcase {...props} />;
    case "SNAP":
    case "WIC":
      return <IconLeaf {...props} />;
    case "MEDICAID":
    case "MEDICAIDABD":
    case "MEDICAIDMAGI":
    case "MEDICAIDWAIVER":
    case "MAWD":
    case "QMB":
      return <IconHeart {...props} fill={color} />;
    case "ABLE":
      return <IconHome {...props} />;
    default:
      return <IconCurrencyDollar {...props} />;
  }
}

export function WalletCard({
  card,
  linked = true,
}: {
  card: ProgramCardModel;
  /** Home and the programs list link into the program. The program page shows the same card in place. */
  linked?: boolean;
}) {
  const fed = card.tier === "federal";
  const big =
    card.currentCents != null ? formatUsdCents(card.currentCents) : "—";
  const sub =
    card.limitCents != null
      ? `of ${formatUsdCents(card.limitCents)}`
      : `${card.total} limit${card.total === 1 ? "" : "s"}`;
  const pct = card.pct != null ? Math.min(card.pct, 100) : 0;
  const reassurance = statusReassurance(card.status, {
    hasLimit: card.limitCents != null,
    code: card.code,
    reportingDue: card.reportingDue,
    wageReport: card.wageReport,
    wageChangeKind: card.wageChangeKind,
  });
  const reportPlace = card.wageReport ? wageReportPlace(card.code) : null;
  const mark = card.status === "ok" ? "✓" : card.status === "warn" ? "!" : "✕";

  const className = `cs-wcard ${fed ? "cs-wcard--fed" : "cs-wcard--state"}${
    linked ? "" : " cs-wcard--static"
  }`;
  const body = (
    <>
      <div className="cs-wcard-seal" aria-hidden>
        {fed ? <SsaSeal /> : <PaKeystoneMark />}
      </div>
      <div className="cs-wcard-in">
        <div className="cs-wcard-top">
          <span className="cs-wcard-label">
            {fed ? (
              <UsFlagMark className="cs-fed-flag" />
            ) : (
              <PaStateChip />
            )}
            <span>{card.tag}</span>
          </span>
          {linked ? (
            <span className="cs-wcard-chevron" aria-hidden>
              ›
            </span>
          ) : null}
        </div>
        <div className="cs-wcard-name">
          <ProgramGlyph code={card.code} />
          {card.label}
        </div>
        <p
          className="cs-wcard-reassure"
          style={{ color: REASSURE[card.status] }}
          data-status={card.status}
        >
          <span aria-hidden>{mark}</span> {reassurance}
        </p>
        {reportPlace && (
          <p className="cs-wcard-next">
            {(card.code === "SSDI" || card.code === "DAC") &&
              "The dollar line is estimated gross wages, not a form to file. "}
            {linked ? (
              reportPlace.sentence
            ) : (
              <a href={reportPlace.href} target="_blank" rel="noreferrer" className="underline">
                {reportPlace.sentence}
              </a>
            )}
          </p>
        )}
        {card.nextDue && (
          <p className="cs-wcard-next">
            Next due{" "}
            {new Date(`${card.nextDue.date}T12:00:00`).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            · {card.nextDue.title} · {card.nextDue.confidenceLabel}
          </p>
        )}
        <div className="cs-wcard-bot">
          <div className="cs-wcard-num">
            {big}
            <span>{sub}</span>
          </div>
          {card.obligations && card.obligations.length > 0 && (
            <ul className="cs-wcard-obs">
              {card.obligations.map((line) => (
                <li key={line.label} className={line.sooner ? "is-sooner" : undefined}>
                  <span className="cs-wcard-obs-k">{line.label}</span>
                  {line.value}
                </li>
              ))}
            </ul>
          )}
          {card.pct != null && (
            <div
              className="cs-wcard-bar"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${card.label} usage ${pct}%`}
            >
              <div
                className="cs-wcard-fill"
                style={{ width: `${pct}%`, background: BAR[card.status] }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (!linked) {
    return <div className={className}>{body}</div>;
  }

  return (
    <Link href={`/programs/${card.code}`} className={className}>
      {body}
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
