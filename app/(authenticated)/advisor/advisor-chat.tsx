"use client";

import { useEffect, useRef, useState } from "react";
import { IconSend } from "@tabler/icons-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

const SUGGESTIONS = [
  "What counts as earned vs unearned income for SSI?",
  "How is the SNAP gross income limit applied to a household of 3?",
  "Why did my asset threshold turn yellow this month?",
  "What's the difference between a predictive alert and a breach alert?",
];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

/** Render inline **bold** spans within a line of assistant text. */
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

/**
 * Lightweight markdown renderer for assistant replies — handles paragraphs,
 * bullet/numbered lists, and inline bold without pulling in a dependency.
 * The advisor is prompted to answer in short paragraphs or tight bullet lists.
 */
function FormattedMessage({ content }: { content: string }) {
  const blocks = content.trim().split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const isBulleted = lines.every((l) => /^\s*[-*]\s+/.test(l));
        const isNumbered = lines.every((l) => /^\s*\d+\.\s+/.test(l));
        if (isBulleted) {
          return (
            <ul key={bi} className="list-disc space-y-1 pl-5">
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.replace(/^\s*[-*]\s+/, ""), `${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        if (isNumbered) {
          return (
            <ol key={bi} className="list-decimal space-y-1 pl-5">
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.replace(/^\s*\d+\.\s+/, ""), `${bi}-${li}`)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <span key={li}>
                {renderInline(l, `${bi}-${li}`)}
                {li < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function AdvisorChat({ initialQuestion }: { initialQuestion?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  // A question handed off from global search (/advisor?ask=…) starts the chat.
  useEffect(() => {
    const q = initialQuestion?.trim();
    if (q && !startedRef.current) {
      startedRef.current = true;
      void send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
    const userMsg: Message = {
      id: genId(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);

    const res = await fetch("/api/advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })) }),
    }).catch(() => null);

    if (!res) {
      setSending(false);
      setError("Network error");
      return;
    }
    if (res.status === 404 || res.status === 503) {
      setSending(false);
      const data = (await res.json().catch(() => ({}))) as { details?: string };
      setMessages((m) => [
        ...m,
        {
          id: genId(),
          role: "assistant",
          content:
            data.details ??
            "The advisor isn't configured yet — set ANTHROPIC_API_KEY in the environment to enable it.",
          createdAt: Date.now(),
        },
      ]);
      return;
    }
    const data = (await res.json().catch(() => ({}))) as {
      reply?: string;
      error?: string;
    };
    setSending(false);
    if (!res.ok) {
      setError(data.error ?? "Advisor failed to respond");
      return;
    }
    setMessages((m) => [
      ...m,
      {
        id: genId(),
        role: "assistant",
        content: data.reply ?? "(empty response)",
        createdAt: Date.now(),
      },
    ]);
  }

  return (
    <section className="flex h-[calc(100vh-260px)] min-h-[420px] flex-col overflow-hidden rounded border border-[var(--color-cs-border)] bg-white">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-[13px]">
        {messages.length === 0 && (
          <div>
            <p className="text-[var(--color-cs-text-secondary)]">Try one of these to get started:</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => void send(s)}
                    className="w-full rounded border border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-3 py-2 text-left text-[12px] hover:bg-[var(--color-cs-nav-hover)]"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {messages.map((m) => (
          <article
            key={m.id}
            className={`flex max-w-[80%] flex-col ${m.role === "user" ? "ml-auto items-end" : "items-start"}`}
          >
            <div
              className={`rounded-2xl px-3.5 py-2 leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-sm bg-[var(--color-cs-brand)] text-white"
                  : "rounded-bl-sm border border-[var(--color-cs-border)] bg-white text-[var(--color-cs-text)]"
              }`}
            >
              {m.role === "assistant" ? (
                <FormattedMessage content={m.content} />
              ) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              )}
            </div>
            <span className="mt-0.5 text-[10px] text-[var(--color-cs-text-muted)]">
              {new Date(m.createdAt).toLocaleTimeString()}
            </span>
          </article>
        ))}
        {sending && (
          <div className="flex max-w-[80%] items-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-[var(--color-cs-border)] bg-white px-3.5 py-2.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-cs-text-muted)] [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-cs-text-muted)] [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-cs-text-muted)]" />
            </div>
          </div>
        )}
        {error && <p className="text-[12px] text-[var(--color-cs-danger)]">{error}</p>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-center gap-2 border-t border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-3 py-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about thresholds, alerts, or programs"
          disabled={sending}
          className="h-9 flex-1 rounded-sm border border-[var(--color-cs-border)] bg-white px-2 text-[13px]"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-[var(--color-cs-brand)] px-3 text-[12px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
        >
          <IconSend size={14} stroke={1.5} aria-hidden />
          Send
        </button>
      </form>
    </section>
  );
}
