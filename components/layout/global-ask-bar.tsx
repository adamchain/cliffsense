"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AskComposer } from "./ask-composer";

export function GlobalAskBar() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit() {
    const q = value.trim();
    if (!q) return;
    setValue("");
    router.push(`/advisor?ask=${encodeURIComponent(q.slice(0, 500))}`);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-[35] flex justify-center px-4 lg:bottom-5">
      <div className="pointer-events-auto w-full max-w-xl rounded-[24px] bg-[rgba(248,248,250,0.92)] p-1.5 shadow-[var(--shadow-cs-float)] backdrop-blur">
        <AskComposer value={value} onChange={setValue} onSubmit={submit} />
      </div>
    </div>
  );
}
