"use client";

import { useEffect, useRef, useState } from "react";
import { IconSend } from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

const SUGGESTIONS = [
  "How is my income being categorized this month — earned vs unearned?",
  "Am I close to any of my benefit limits right now?",
  "Which exclusions apply to my wages for SSI this month?",
  "Review my recent deposits — is there anything I should report?",
];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Renders assistant replies as GitHub-flavored markdown (headings, bold,
 * lists, blockquotes, tables, code) styled via the `.cs-prose` class. Safe to
 * call on a partial string while the reply is still streaming in.
 */
function FormattedMessage({ content }: { content: string }) {
  return (
    <div className="cs-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export function AdvisorChat({ initialQuestion }: { initialQuestion?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
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
      body: JSON.stringify({
        messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
      }),
    }).catch(() => null);

    if (!res) {
      setSending(false);
      setError("Network error");
      return;
    }

    // Non-streaming responses are errors (advisor not configured, rate limit, …).
    if (!res.ok || !res.body) {
      const data = (await res.json().catch(() => ({}))) as { error?: string; details?: string };
      setSending(false);
      if (res.status === 404 || res.status === 503) {
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
      setError(data.error ?? "Advisor failed to respond");
      return;
    }

    // Stream the reply in, updating the assistant bubble as text arrives.
    const assistantId = genId();
    setMessages((m) => [
      ...m,
      { id: assistantId, role: "assistant", content: "", createdAt: Date.now() },
    ]);
    setStreamingId(assistantId);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, content: acc } : x)));
      }
    } catch {
      setError("The response was interrupted.");
    }

    if (!acc.trim()) {
      setMessages((m) =>
        m.map((x) => (x.id === assistantId ? { ...x, content: "(empty response)" } : x)),
      );
    }
    setStreamingId(null);
    setSending(false);
  }

  return (
    <section className="flex h-[calc(100vh-260px)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-[var(--color-cs-border)] bg-white">
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
                    className="w-full rounded-xl border border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-3 py-2 text-left text-[12px] hover:bg-[var(--color-cs-nav-hover)]"
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
            className={`flex max-w-[85%] flex-col ${m.role === "user" ? "ml-auto items-end" : "items-start"}`}
          >
            <div
              className={`rounded-2xl px-3.5 py-2 leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-sm bg-[var(--color-cs-brand)] text-white"
                  : "rounded-bl-sm border border-[var(--color-cs-border)] bg-white text-[var(--color-cs-text)]"
              }`}
            >
              {m.role === "assistant" ? (
                <>
                  <FormattedMessage content={m.content} />
                  {streamingId === m.id && (
                    <span
                      className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-[var(--color-cs-brand)] align-middle"
                      aria-hidden
                    />
                  )}
                </>
              ) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              )}
            </div>
            <span className="mt-0.5 text-[10px] text-[var(--color-cs-text-muted)]">
              {new Date(m.createdAt).toLocaleTimeString()}
            </span>
          </article>
        ))}
        {/* Bouncing dots only before the first streamed token arrives. */}
        {sending && !streamingId && (
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
          className="h-9 flex-1 rounded-xl border border-[var(--color-cs-border)] bg-white px-3 text-[13px]"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--color-cs-brand)] px-3 text-[12px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
        >
          <IconSend size={14} stroke={1.5} aria-hidden />
          Send
        </button>
      </form>
    </section>
  );
}
