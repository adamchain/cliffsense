"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCornerDownLeft,
  IconLoader2,
  IconMessageChatbot,
  IconSearch,
} from "@tabler/icons-react";

type SearchItem = { label: string; sublabel?: string; href: string };
type SearchGroup = { type: string; items: SearchItem[] };

/**
 * Topbar controls: browser-style back/forward buttons on the left, then a wide
 * global search that queries the user's data and app destinations. When a
 * search returns nothing, the user can hand the query to the AI advisor, which
 * opens the advisor page with the question pre-loaded and starts a chat.
 */
export function TopbarControls() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Debounced search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setGroups([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { groups?: SearchGroup[]; total?: number };
        setGroups(data.groups ?? []);
        setTotal(data.total ?? 0);
      } catch {
        /* aborted or network error — leave prior results */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    setGroups([]);
    router.push(href);
  }

  function askAdvisor() {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    setQuery("");
    setGroups([]);
    router.push(`/advisor?ask=${encodeURIComponent(q)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const first = groups[0]?.items[0];
      if (total > 0 && first) go(first.href);
      else if (query.trim().length >= 2) askAdvisor();
    }
  }

  const showNoResults = open && query.trim().length >= 2 && !loading && total === 0;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {/* Back / forward */}
      <div className="hidden shrink-0 items-center gap-1 sm:flex">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-text)]"
        >
          <IconChevronLeft size={20} stroke={2} />
        </button>
        <button
          type="button"
          onClick={() => router.forward()}
          aria-label="Go forward"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-text)]"
        >
          <IconChevronRight size={20} stroke={2} />
        </button>
      </div>

      {/* Search */}
      <div ref={wrapRef} className="relative min-w-0 flex-1">
        <div className="flex items-center gap-2 rounded-full border border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-3 focus-within:border-[var(--color-cs-brand)] focus-within:bg-white">
          {loading ? (
            <IconLoader2 size={17} className="shrink-0 animate-spin text-[var(--color-cs-text-muted)]" aria-hidden />
          ) : (
            <IconSearch size={17} className="shrink-0 text-[var(--color-cs-text-muted)]" aria-hidden />
          )}
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search transactions, alerts, limits, forms…"
            aria-label="Global search"
            className="h-10 w-full bg-transparent text-[14px] text-[var(--color-cs-text)] outline-none placeholder:text-[var(--color-cs-text-muted)]"
          />
          {query ? (
            <kbd className="hidden shrink-0 items-center gap-1 rounded border border-[var(--color-cs-border)] px-1.5 py-0.5 text-[10px] text-[var(--color-cs-text-muted)] sm:flex">
              <IconCornerDownLeft size={11} stroke={2} /> enter
            </kbd>
          ) : null}
        </div>

        {/* Results dropdown */}
        {open && query.trim().length >= 2 ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-[var(--color-cs-border)] bg-white p-2 shadow-[var(--shadow-cs-float)]">
            {total > 0 ? (
              <>
                {groups.map((g) => (
                  <div key={g.type} className="mb-1.5 last:mb-0">
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
                      {g.type}
                    </div>
                    <ul>
                      {g.items.map((it, i) => (
                        <li key={`${g.type}-${i}`}>
                          <button
                            type="button"
                            onClick={() => go(it.href)}
                            className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left hover:bg-[var(--color-cs-nav-hover)]"
                          >
                            <span className="min-w-0 truncate text-[13px] font-medium text-[var(--color-cs-text)]">
                              {it.label}
                            </span>
                            {it.sublabel ? (
                              <span className="shrink-0 text-[11px] tabular-nums text-[var(--color-cs-text-muted)]">
                                {it.sublabel}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {/* Always offer the advisor as a fallback action */}
                <button
                  type="button"
                  onClick={askAdvisor}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-[var(--color-cs-border)] px-2 py-2.5 text-left text-[12px] font-semibold text-[var(--color-cs-brand)] hover:bg-[var(--color-cs-info-bg)]"
                >
                  <IconMessageChatbot size={15} stroke={1.8} aria-hidden />
                  Ask the advisor: “{query.trim()}”
                </button>
              </>
            ) : showNoResults ? (
              <div className="p-2">
                <p className="px-1 py-2 text-[12px] text-[var(--color-cs-text-secondary)]">
                  No results for “{query.trim()}”.
                </p>
                <button
                  type="button"
                  onClick={askAdvisor}
                  className="flex w-full items-center gap-2 rounded-xl bg-[var(--color-cs-brand)] px-3 py-2.5 text-left text-[13px] font-semibold text-white hover:bg-[var(--color-cs-brand-hover)]"
                >
                  <IconMessageChatbot size={16} stroke={1.8} aria-hidden />
                  Ask the advisor this question
                </button>
                <p className="mt-1.5 px-1 text-[11px] text-[var(--color-cs-text-muted)]">
                  Opens the AI advisor with your question and starts a chat.
                </p>
              </div>
            ) : (
              <p className="p-3 text-[12px] text-[var(--color-cs-text-muted)]">Searching…</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
