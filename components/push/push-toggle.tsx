"use client";

import { useEffect, useState } from "react";

/** base64url VAPID public key → Uint8Array for PushManager.subscribe. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type State =
  | "loading"
  | "unsupported"
  | "disabled-provider"
  | "off"
  | "on"
  | "blocked";

export function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!supported) {
        if (!cancelled) setState("unsupported");
        return;
      }

      const res = await fetch("/api/push/public-key").then((r) => r.json()).catch(() => null);
      if (!res?.enabled) {
        if (!cancelled) setState("disabled-provider");
        return;
      }

      if (Notification.permission === "denied") {
        if (!cancelled) setState("blocked");
        return;
      }

      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const existing = await reg.pushManager.getSubscription();
        if (!cancelled) setState(existing ? "on" : "off");
      } catch {
        if (!cancelled) setState("unsupported");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        return;
      }
      const keyRes = await fetch("/api/push/public-key").then((r) => r.json());
      if (!keyRes?.publicKey) throw new Error("Push is not configured.");

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyRes.publicKey) as BufferSource,
      });

      const json = sub.toJSON();
      const save = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!save.ok) throw new Error("Could not save subscription.");
      setState("on");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not disable notifications.");
    } finally {
      setBusy(false);
    }
  }

  const muted = "text-[12px] text-[var(--color-cs-text-secondary)]";

  if (state === "loading") {
    return <p className={muted}>Checking device support…</p>;
  }
  if (state === "unsupported") {
    return <p className={muted}>This browser doesn’t support push notifications.</p>;
  }
  if (state === "disabled-provider") {
    return <p className={muted}>Push notifications aren’t configured on the server yet.</p>;
  }
  if (state === "blocked") {
    return (
      <p className={muted}>
        Notifications are blocked for this site. Enable them in your browser’s site settings, then
        reload.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[var(--color-cs-text)]">
          Push notifications are <strong>{state === "on" ? "on" : "off"}</strong> for this device.
        </span>
        {state === "on" ? (
          <button
            type="button"
            onClick={disable}
            disabled={busy}
            className="rounded-sm border border-[var(--color-cs-border)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-cs-text)] hover:bg-[var(--color-cs-nav-hover)] disabled:opacity-50"
          >
            {busy ? "Turning off…" : "Turn off"}
          </button>
        ) : (
          <button
            type="button"
            onClick={enable}
            disabled={busy}
            className="rounded-sm bg-[var(--color-cs-brand)] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
          >
            {busy ? "Enabling…" : "Enable on this device"}
          </button>
        )}
      </div>
      {error && <p className="text-[12px] text-[var(--color-cs-danger)]">{error}</p>}
    </div>
  );
}
