"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IconMessagePlus,
  IconHistory,
  IconPencil,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { AdvisorChat, type Message } from "./advisor-chat";

type ConversationSummary = {
  id: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
  preview: string;
};

let msgSeq = 0;
function toMessages(
  rows: { role: "user" | "assistant"; content: string }[],
): Message[] {
  return rows.map((m) => ({
    id: `h${msgSeq++}`,
    role: m.role,
    content: m.content,
    createdAt: 0,
  }));
}

function relativeTime(iso: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AdvisorWorkspace({
  initialQuestion,
  beneficiaryId,
}: {
  initialQuestion?: string;
  beneficiaryId: string | null;
}) {
  const [list, setList] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [chatKey, setChatKey] = useState("new:0");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingConvo, setLoadingConvo] = useState(false);
  // The handed-off question only seeds the very first new chat.
  const [pendingQuestion, setPendingQuestion] = useState(initialQuestion);

  const refreshList = useCallback(async () => {
    try {
      const res = await fetch("/api/advisor/conversations");
      const data = await res.json();
      setList(Array.isArray(data.conversations) ? data.conversations : []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const newChat = useCallback(() => {
    setSelectedId(null);
    setInitialMessages([]);
    setChatKey(`new:${Date.now()}`);
    setPendingQuestion(undefined);
    setDrawerOpen(false);
  }, []);

  const openConversation = useCallback(async (id: string) => {
    setLoadingConvo(true);
    setDrawerOpen(false);
    try {
      const res = await fetch(`/api/advisor/conversations/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setInitialMessages(toMessages(data.conversation?.messages ?? []));
      setSelectedId(id);
      setChatKey(`c:${id}`);
      setPendingQuestion(undefined);
    } finally {
      setLoadingConvo(false);
    }
  }, []);

  const handleConversationChange = useCallback(
    (id: string, title: string) => {
      setSelectedId((cur) => cur ?? id);
      setList((prev) => {
        const without = prev.filter((c) => c.id !== id);
        const existing = prev.find((c) => c.id === id);
        return [
          {
            id,
            title,
            lastMessageAt: new Date().toISOString(),
            messageCount: (existing?.messageCount ?? 0) + 2,
            preview: existing?.preview ?? "",
          },
          ...without,
        ];
      });
    },
    [],
  );

  const rename = useCallback(async (id: string, current: string) => {
    const next = window.prompt("Rename chat", current);
    if (!next || next.trim() === current) return;
    await fetch(`/api/advisor/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: next.trim() }),
    });
    setList((prev) => prev.map((c) => (c.id === id ? { ...c, title: next.trim() } : c)));
  }, []);

  const remove = useCallback(
    async (id: string) => {
      if (!window.confirm("Delete this chat?")) return;
      await fetch(`/api/advisor/conversations/${id}`, { method: "DELETE" });
      setList((prev) => prev.filter((c) => c.id !== id));
      if (selectedId === id) newChat();
    },
    [selectedId, newChat],
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <button
        type="button"
        onClick={newChat}
        className="mb-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--color-cs-brand)] px-3.5 py-2 text-[13px] font-semibold text-white hover:opacity-90"
      >
        <IconMessagePlus size={16} stroke={2} aria-hidden />
        New chat
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <p className="px-1 py-4 text-[12px] text-[var(--color-cs-text-muted)]">
            Your past chats will appear here.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {list.map((c) => (
              <li key={c.id}>
                <div
                  className={`group flex items-center gap-1 rounded-[10px] px-2 py-1.5 ${
                    selectedId === c.id
                      ? "bg-[var(--color-cs-brand-soft)]"
                      : "hover:bg-[var(--color-cs-surface)]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openConversation(c.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-[12.5px] font-medium text-[var(--color-cs-text)]">
                      {c.title}
                    </span>
                    <span className="block text-[11px] text-[var(--color-cs-text-muted)]">
                      {relativeTime(c.lastMessageAt)}
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => rename(c.id, c.title)}
                      aria-label="Rename"
                      className="rounded p-1 text-[var(--color-cs-text-muted)] hover:text-[var(--color-cs-text)]"
                    >
                      <IconPencil size={13} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      aria-label="Delete"
                      className="rounded p-1 text-[var(--color-cs-text-muted)] hover:text-[#c0392b]"
                    >
                      <IconTrash size={13} aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 w-full flex-1 gap-3">
      {/* Desktop history rail */}
      <aside className="hidden w-[232px] shrink-0 rounded-[18px] bg-[var(--color-cs-card)] p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[80%] max-w-[300px] bg-[var(--color-cs-card)] p-3 shadow-xl">
            <div className="mb-2 flex justify-end">
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close">
                <IconX size={18} aria-hidden />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-cs-card)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-cs-text)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          >
            <IconHistory size={15} aria-hidden />
            History
          </button>
          <button
            type="button"
            onClick={newChat}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-cs-brand)] px-3 py-1.5 text-[12.5px] font-semibold text-white"
          >
            <IconMessagePlus size={15} aria-hidden />
            New
          </button>
        </div>
        {loadingConvo ? (
          <div className="flex flex-1 items-center justify-center text-[13px] text-[var(--color-cs-text-secondary)]">
            Loading chat…
          </div>
        ) : (
          <AdvisorChat
            key={chatKey}
            initialQuestion={selectedId === null ? pendingQuestion : undefined}
            conversationId={selectedId}
            initialMessages={initialMessages}
            beneficiaryId={beneficiaryId}
            onConversationChange={handleConversationChange}
          />
        )}
      </div>
    </div>
  );
}
