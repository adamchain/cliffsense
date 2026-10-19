"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconArrowRight,
  IconChevronLeft,
  IconChevronRight,
  IconMenu2,
  IconMoon,
  IconSearch,
  IconSun,
  IconX,
} from "@tabler/icons-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import {
  DOC_BOOKS,
  OVERVIEW_LEDE,
  TRAINING,
  UPDATES,
  USE_CASES,
  articlePlainText,
  articlesIn,
  findArticle,
  type Block,
  type GuideArticle,
  type GuideBook,
} from "@/components/guides/content";

const SHOTS = [
  { src: "/screenshots/home-desktop.png", alt: "Home, with program cards and the next deadlines" },
  { src: "/screenshots/calendar-desktop.png", alt: "Calendar of renewals, reports, and reviews" },
  { src: "/screenshots/money.png", alt: "Money, with linked accounts and categorized activity" },
  { src: "/screenshots/vault-desktop.png", alt: "Vault folders for identity, benefits, and notices" },
  { src: "/screenshots/guided-form.png", alt: "A guided government form" },
  { src: "/screenshots/reports.png", alt: "Exports of activity and limit history" },
  { src: "/marketing/advisor.png", alt: "Advisor answering a question about this record" },
  { src: "/screenshots/dashboard.png", alt: "Limits and status on the dashboard" },
];

type Collection = "docs" | "use-cases" | "training";

const THEME_KEY = "bw-guides-theme";

function plain(text: string): string {
  return text.replace(/\*\*/g, "").replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2");
}

function Rich({
  text,
  onJump,
}: {
  text: string;
  onJump: (id: string) => void;
}) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold text-[var(--gd-text)]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        const link = /^\[\[([^\]|]+)\|([^\]]+)\]\]$/.exec(part);
        if (!link) return <span key={index}>{part}</span>;
        const href = link[1];
        const label = link[2];
        const className = "font-medium text-[var(--gd-text)] underline decoration-[var(--gd-line)] underline-offset-[3px] hover:decoration-[var(--gd-text)]";
        if (href.startsWith("#")) {
          return (
            <button key={index} type="button" onClick={() => onJump(href.slice(1))} className={className}>
              {label}
            </button>
          );
        }
        if (href.startsWith("http") || href.startsWith("mailto:")) {
          return (
            <a
              key={index}
              href={href}
              className={className}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {label}
            </a>
          );
        }
        return (
          <Link key={index} href={href} className={className}>
            {label}
          </Link>
        );
      })}
    </>
  );
}

function Blocks({ blocks, onJump }: { blocks: Block[]; onJump: (id: string) => void }) {
  return (
    <div className="mt-8 space-y-5 text-[16px] leading-relaxed text-[var(--gd-muted)]">
      {blocks.map((block, index) => {
        if (block.kind === "h") {
          return (
            <h2 key={index} className="pt-2 text-[22px] font-medium tracking-tight text-[var(--gd-text)]">
              {block.text}
            </h2>
          );
        }
        if (block.kind === "p") {
          return (
            <p key={index}>
              <Rich text={block.text} onJump={onJump} />
            </p>
          );
        }
        if (block.kind === "note") {
          return (
            <div key={index} className="rounded-2xl bg-[var(--gd-soft)] px-4 py-3 text-[14.5px]">
              <Rich text={block.text} onJump={onJump} />
            </div>
          );
        }
        if (block.kind === "steps") {
          return (
            <ol key={index} className="space-y-3">
              {block.items.map((item, step) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gd-invert)] text-[12px] font-semibold text-[var(--gd-invert-text)]">
                    {step + 1}
                  </span>
                  <span className="pt-0.5">
                    <Rich text={item} onJump={onJump} />
                  </span>
                </li>
              ))}
            </ol>
          );
        }
        if (block.kind === "bullets") {
          return (
            <ul key={index} className="list-disc space-y-2 pl-5">
              {block.items.map((item) => (
                <li key={item}>
                  <Rich text={item} onJump={onJump} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.kind === "defs") {
          return (
            <dl key={index} className="space-y-4">
              {block.items.map((item) => (
                <div key={item.name}>
                  <dt className="font-medium text-[var(--gd-text)]">{item.name}</dt>
                  <dd className="mt-1">
                    <Rich text={item.text} onJump={onJump} />
                  </dd>
                </div>
              ))}
            </dl>
          );
        }
        return (
          <div key={index} className="overflow-x-auto">
            <p className="mb-2 text-[13px] text-[var(--gd-muted)]">{block.caption}</p>
            <table className="w-full min-w-[36rem] border-collapse text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-[var(--gd-line)] text-[var(--gd-text)]">
                  {block.headers.map((header) => (
                    <th key={header} className="px-2 py-2 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row[0]} className="border-b border-[var(--gd-line)] align-top">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className={`px-2 py-2.5 ${cellIndex === 0 ? "font-medium text-[var(--gd-text)]" : ""}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

function bookFor(collection: Collection, bookId: string): GuideBook {
  if (collection === "use-cases") return USE_CASES;
  if (collection === "training") return TRAINING;
  return DOC_BOOKS.find((book) => book.id === bookId) ?? DOC_BOOKS[0];
}

export function GuidesDocs() {
  const [collection, setCollection] = useState<Collection>("docs");
  const [bookId, setBookId] = useState("overview");
  const [articleId, setArticleId] = useState("home");
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [shot, setShot] = useState(0);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "dark") setDark(true);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (!searchOpen && !navOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, navOpen]);

  const book = bookFor(collection, bookId);
  const landing = collection === "docs" && book.id === "overview" && articleId === "home";
  const article = articlesIn(book).find((item) => item.id === articleId) ?? null;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return [...DOC_BOOKS, USE_CASES, TRAINING]
      .flatMap((item) => articlesIn(item).map((entry) => ({ book: item, article: entry })))
      .filter(({ article: entry }) => plain(articlePlainText(entry)).toLowerCase().includes(q))
      .slice(0, 8);
  }, [query]);

  function openId(id: string) {
    if (id === "home") {
      setCollection("docs");
      setBookId("overview");
      setArticleId("home");
    } else {
      const found = findArticle(id);
      if (!found) return;
      if (found.book.id === "use-cases") setCollection("use-cases");
      else if (found.book.id === "training") setCollection("training");
      else {
        setCollection("docs");
        setBookId(found.book.id);
      }
      setArticleId(found.article.id);
    }
    setSearchOpen(false);
    setNavOpen(false);
    setQuery("");
    window.scrollTo({ top: 0 });
  }

  function openCollection(next: Collection) {
    setCollection(next);
    if (next === "docs") {
      setBookId("overview");
      setArticleId("home");
    } else if (next === "use-cases") {
      setArticleId(articlesIn(USE_CASES)[0].id);
    } else {
      setArticleId(articlesIn(TRAINING)[0].id);
    }
    setNavOpen(false);
    window.scrollTo({ top: 0 });
  }

  function openBook(id: string) {
    const next = DOC_BOOKS.find((item) => item.id === id) ?? DOC_BOOKS[0];
    setCollection("docs");
    setBookId(next.id);
    setArticleId(next.homeId ?? articlesIn(next)[0].id);
    setNavOpen(false);
    window.scrollTo({ top: 0 });
  }

  const sequence = [
    ...(book.homeId ? [{ id: book.homeId, label: "Home" }] : []),
    ...articlesIn(book).map((item) => ({ id: item.id, label: item.label })),
  ];
  const sequenceIndex = sequence.findIndex((item) => item.id === articleId);
  const previous = sequenceIndex > 0 ? sequence[sequenceIndex - 1] : null;
  const next = sequenceIndex >= 0 && sequenceIndex < sequence.length - 1 ? sequence[sequenceIndex + 1] : null;

  const theme = dark
    ? {
        "--gd-bg": "#121212",
        "--gd-text": "#f5f5f5",
        "--gd-muted": "#a3a3a3",
        "--gd-line": "rgba(255,255,255,0.12)",
        "--gd-soft": "#1c1c1e",
        "--gd-invert": "#f5f5f5",
        "--gd-invert-text": "#121212",
      }
    : {
        "--gd-bg": "#ffffff",
        "--gd-text": "#171717",
        "--gd-muted": "#5f5f5f",
        "--gd-line": "rgba(0,0,0,0.08)",
        "--gd-soft": "#f4f4f5",
        "--gd-invert": "#171717",
        "--gd-invert-text": "#ffffff",
      };

  const sidebar = (
    <nav aria-label="Guides" className="px-2 py-6">
      <button
        type="button"
        onClick={() => openId("home")}
        className={`mb-6 rounded-lg px-3 py-1.5 text-left text-[14px] font-medium ${
          landing ? "bg-[var(--gd-soft)] text-[var(--gd-text)]" : "text-[var(--gd-muted)] hover:text-[var(--gd-text)]"
        }`}
      >
        Home
      </button>
      {book.groups.map((group) => (
        <div key={group.heading} className="mb-6">
          <h2 className="px-3 text-[14px] font-semibold text-[var(--gd-text)]">{group.heading}</h2>
          <ul className="mt-1.5">
            {group.articles.map((item) => {
              const active = item.id === articleId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openId(item.id)}
                    className={`w-full rounded-lg px-3 py-1.5 text-left text-[14px] leading-snug ${
                      active ? "font-medium text-[var(--gd-text)]" : "text-[var(--gd-muted)] hover:text-[var(--gd-text)]"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[var(--gd-bg)] text-[var(--gd-text)]" style={theme as CSSProperties}>
      <header className="sticky top-0 z-40 border-b border-[var(--gd-line)] bg-[var(--gd-bg)]/90 backdrop-blur">
        <div className="relative flex h-14 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--gd-soft)] lg:hidden"
            aria-label="Open guides menu"
            onClick={() => setNavOpen(true)}
          >
            <IconMenu2 size={18} stroke={1.8} />
          </button>
          <Link href="/" className="shrink-0" aria-label="Bene-Watch home">
            <BrandLogo className="h-6 w-auto max-w-[7.5rem] sm:h-7 sm:max-w-none" />
          </Link>
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 text-[14px] md:flex" aria-label="Site">
            <button
              type="button"
              onClick={() => openId("home")}
              className={`rounded-full px-3 py-1.5 ${landing ? "bg-[var(--gd-soft)] font-medium text-[var(--gd-text)]" : "text-[var(--gd-muted)] hover:text-[var(--gd-text)]"}`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => openCollection("docs")}
              className={`rounded-full px-3 py-1.5 ${collection === "docs" && !landing ? "bg-[var(--gd-soft)] font-medium text-[var(--gd-text)]" : "text-[var(--gd-muted)] hover:text-[var(--gd-text)]"}`}
            >
              Docs
            </button>
            <button
              type="button"
              onClick={() => openCollection("use-cases")}
              className={`rounded-full px-3 py-1.5 ${collection === "use-cases" ? "bg-[var(--gd-soft)] font-medium text-[var(--gd-text)]" : "text-[var(--gd-muted)] hover:text-[var(--gd-text)]"}`}
            >
              Use cases
            </button>
            <button
              type="button"
              onClick={() => openCollection("training")}
              className={`rounded-full px-3 py-1.5 ${collection === "training" ? "bg-[var(--gd-soft)] font-medium text-[var(--gd-text)]" : "text-[var(--gd-muted)] hover:text-[var(--gd-text)]"}`}
            >
              Training
            </button>
            <Link href="/resources" className="rounded-full px-3 py-1.5 text-[var(--gd-muted)] hover:text-[var(--gd-text)]">
              Resources
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center gap-1 rounded-full bg-[var(--gd-invert)] px-3.5 text-[13px] font-medium text-[var(--gd-invert-text)]"
            >
              <span className="sm:hidden">Open app</span>
              <span className="hidden sm:inline">Open Bene-Watch</span>
              <IconArrowRight size={14} stroke={2} aria-hidden />
            </Link>
            <button
              type="button"
              aria-label={dark ? "Switch to light appearance" : "Switch to dark appearance"}
              onClick={() => setDark((value) => !value)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--gd-muted)] hover:bg-[var(--gd-soft)] hover:text-[var(--gd-text)]"
            >
              {dark ? <IconMoon size={16} stroke={1.8} /> : <IconSun size={16} stroke={1.8} />}
            </button>
            <button
              type="button"
              aria-label="Search guides"
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--gd-muted)] hover:bg-[var(--gd-soft)] hover:text-[var(--gd-text)]"
            >
              <IconSearch size={16} stroke={1.8} />
            </button>
          </div>
        </div>
        {collection === "docs" && (
          <div className="flex gap-6 overflow-x-auto px-4 sm:justify-center sm:px-6">
            {DOC_BOOKS.map((item) => {
              const active = item.id === book.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openBook(item.id)}
                  className={`shrink-0 border-b-2 px-0.5 py-3 text-[14px] ${
                    active
                      ? "border-[var(--gd-text)] font-medium text-[var(--gd-text)]"
                      : "border-transparent text-[var(--gd-muted)] hover:text-[var(--gd-text)]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <aside className="sticky top-[108px] hidden max-h-[calc(100vh-108px)] overflow-y-auto lg:block">{sidebar}</aside>
        <main className="min-w-0 px-4 py-10 pb-28 sm:px-6 sm:py-14">
          {landing ? (
            <Overview onOpen={openId} shot={shot} setShot={setShot} />
          ) : article ? (
            <ArticleView article={article} onJump={openId} />
          ) : (
            <Overview onOpen={openId} shot={shot} setShot={setShot} />
          )}

          {!landing && (previous || next) && (
            <div className="mt-12 flex items-center justify-between gap-4 border-t border-[var(--gd-line)] pt-6 text-[14px]">
              {previous ? (
                <button type="button" onClick={() => openId(previous.id)} className="text-[var(--gd-muted)] hover:text-[var(--gd-text)]">
                  ← {previous.label}
                </button>
              ) : (
                <span />
              )}
              {next && (
                <button type="button" onClick={() => openId(next.id)} className="font-medium hover:underline">
                  {next.label} →
                </button>
              )}
            </div>
          )}

          <p className="mt-10 max-w-2xl text-[12.5px] leading-relaxed text-[var(--gd-muted)]">
            Bene-Watch organizes the household record and estimates from the accounts you link. It does not decide
            eligibility, file forms, or replace SSA, your county assistance office, Pennie, or a benefits counselor. A
            printed notice wins when it disagrees with an estimate.{" "}
            <Link href="/legal/privacy" className="underline">
              Privacy
            </Link>
            {" · "}
            <Link href="/legal/terms" className="underline">
              Terms
            </Link>
            {" · "}
            <Link href="/legal/security" className="underline">
              Security
            </Link>
          </p>
        </main>
      </div>

      <Link
        href="/advisor"
        className="fixed bottom-5 right-5 z-30 inline-flex h-11 items-center rounded-full bg-[var(--gd-invert)] px-4 text-[14px] font-medium text-[var(--gd-invert-text)] shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
      >
        Ask Advisor
      </Link>

      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Guides menu">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[min(100%,280px)] overflow-y-auto bg-[var(--gd-bg)] shadow-xl">
            <div className="flex items-center justify-between px-4 pt-4">
              <span className="text-[13px] font-medium text-[var(--gd-muted)]">Guides</span>
              <button type="button" aria-label="Close menu" onClick={() => setNavOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--gd-soft)]">
                <IconX size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              <button type="button" onClick={() => openCollection("docs")} className="rounded-full bg-[var(--gd-soft)] px-3 py-1 text-[13px]">
                Docs
              </button>
              <button type="button" onClick={() => openCollection("use-cases")} className="rounded-full bg-[var(--gd-soft)] px-3 py-1 text-[13px]">
                Use cases
              </button>
              <button type="button" onClick={() => openCollection("training")} className="rounded-full bg-[var(--gd-soft)] px-3 py-1 text-[13px]">
                Training
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search guides">
          <button type="button" className="absolute inset-0" aria-label="Close search" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-[var(--gd-bg)] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-[var(--gd-line)] px-4">
              <IconSearch size={16} className="text-[var(--gd-muted)]" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search guides"
                aria-label="Search guides"
                className="h-12 w-full bg-transparent text-[15px] text-[var(--gd-text)] outline-none placeholder:text-[var(--gd-muted)]"
              />
            </div>
            <ul className="max-h-80 overflow-y-auto py-2">
              {query.trim().length >= 2 && results.length === 0 && (
                <li className="px-4 py-3 text-[14px] text-[var(--gd-muted)]">No matching guides.</li>
              )}
              {results.map(({ book: resultBook, article: result }) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => openId(result.id)}
                    className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-[var(--gd-soft)]"
                  >
                    <span className="text-[14px] font-medium">{result.title}</span>
                    <span className="text-[12px] text-[var(--gd-muted)]">{resultBook.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Overview({
  onOpen,
  shot,
  setShot,
}: {
  onOpen: (id: string) => void;
  shot: number;
  setShot: (value: number) => void;
}) {
  const current = SHOTS[shot] ?? SHOTS[0];
  return (
    <div>
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div>
          <h1 className="text-[3.1rem] font-medium leading-[1.02] tracking-tight sm:text-[3.6rem]">Overview</h1>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-[var(--gd-muted)]">{OVERVIEW_LEDE}</p>
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => onOpen("quick-start")}
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[var(--gd-invert)] px-5 text-[14px] font-medium text-[var(--gd-invert-text)]"
            >
              Quickstart
              <IconArrowRight size={15} stroke={2} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onOpen("case-caregiver")}
              className="inline-flex items-center gap-1 text-[15px] font-medium underline decoration-[var(--gd-text)] underline-offset-4"
            >
              Explore use cases
              <IconArrowRight size={15} stroke={2} aria-hidden />
            </button>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#8eb4ff] via-[#7a78f2] to-[#9a6dff] p-3 sm:p-4">
          <div className="absolute right-6 top-6 z-20 rounded-full bg-black/55 px-2 py-0.5 text-[12px] font-medium text-white">
            {shot + 1}/{SHOTS.length}
          </div>
          <button
            type="button"
            onClick={() => setShot((shot + SHOTS.length - 1) % SHOTS.length)}
            className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#171717] shadow"
            aria-label="Previous screenshot"
          >
            <IconChevronLeft size={16} stroke={2} />
          </button>
          <button
            type="button"
            onClick={() => setShot((shot + 1) % SHOTS.length)}
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#171717] shadow"
            aria-label="Next screenshot"
          >
            <IconChevronRight size={16} stroke={2} />
          </button>
          <button
            type="button"
            className="block w-full overflow-hidden rounded-[20px] bg-white shadow-[0_18px_40px_rgba(20,20,60,0.18)]"
            onClick={() => setShot((shot + 1) % SHOTS.length)}
            aria-label={`${current.alt}. Show the next screenshot.`}
          >
            <Image
              src={current.src}
              alt={current.alt}
              width={1440}
              height={900}
              priority={shot === 0}
              className="h-auto max-h-[420px] w-full object-cover object-top"
            />
          </button>
        </div>
      </div>

      <div className="mt-16 sm:mt-24">
        <div className="flex items-end justify-between gap-3">
          <h2 className="whitespace-nowrap text-[1.85rem] font-medium leading-none tracking-tight sm:text-[3.2rem]">
            What&apos;s new
          </h2>
          <button type="button" onClick={() => onOpen("whats-new")} className="mb-0.5 shrink-0 text-[13px] font-medium text-[var(--gd-muted)] hover:text-[var(--gd-text)] sm:text-[14px]">
            View all updates →
          </button>
        </div>
        <ul className="mt-8 divide-y divide-[var(--gd-line)] border-y border-[var(--gd-line)]">
          {UPDATES.map((update) => (
            <li key={update.title}>
              <button
                type="button"
                onClick={() => onOpen(update.articleId)}
                className="grid w-full gap-2 py-5 text-left sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-center sm:gap-6"
              >
                <span className="text-[14px] text-[var(--gd-muted)]">{update.date}</span>
                <span>
                  <span className="block text-[16px] font-semibold tracking-tight">{update.title}</span>
                  <span className="mt-1 block text-[14px] leading-relaxed text-[var(--gd-muted)]">{update.body}</span>
                </span>
                <IconArrowRight size={18} className="hidden text-[var(--gd-muted)] sm:block" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ArticleView({ article, onJump }: { article: GuideArticle; onJump: (id: string) => void }) {
  return (
    <article className="max-w-3xl">
      <h1 className="text-[2.7rem] font-medium leading-[1.05] tracking-tight sm:text-[3.25rem]">{article.title}</h1>
      <p className="mt-5 text-[17px] leading-relaxed text-[var(--gd-muted)]">
        <Rich text={article.lede} onJump={onJump} />
      </p>
      <Blocks blocks={article.blocks} onJump={onJump} />
    </article>
  );
}
