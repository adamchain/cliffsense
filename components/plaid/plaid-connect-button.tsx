"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { IconBuildingBank } from "@tabler/icons-react";

const LINK_TOKEN_STORAGE_KEY = "cs.plaid.linkToken";
const LINK_CONTEXT_STORAGE_KEY = "cs.plaid.linkContext";

type StoredContext = { beneficiaryId: string; bankConnectionId?: string };

function PlaidLinkInner({
  linkToken,
  onSuccess: onLinkSuccess,
  label,
  autoOpen,
}: {
  linkToken: string;
  onSuccess: (publicToken: string | null) => Promise<void>;
  label: string;
  autoOpen: boolean;
}) {
  const [working, setWorking] = useState(false);
  const onSuccess = useCallback(
    async (publicToken: string | null) => {
      setWorking(true);
      try {
        await onLinkSuccess(publicToken);
      } finally {
        setWorking(false);
      }
    },
    [onLinkSuccess],
  );

  const receivedRedirectUri = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return window.location.href.includes("oauth_state_id=") ? window.location.href : undefined;
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    receivedRedirectUri,
    onSuccess: (publicToken) => {
      void onSuccess(publicToken ?? null);
    },
    onExit: () => {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(LINK_TOKEN_STORAGE_KEY);
        window.sessionStorage.removeItem(LINK_CONTEXT_STORAGE_KEY);
      }
    },
  });

  useEffect(() => {
    if (ready && autoOpen) {
      open();
    }
  }, [ready, autoOpen, open]);

  return (
    <button
      type="button"
      disabled={!ready || working}
      onClick={() => open()}
      className="flex w-full items-center justify-center gap-2 rounded-sm bg-[var(--color-cs-brand)] py-3 text-sm font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
    >
      <IconBuildingBank size={18} aria-hidden />
      {working ? "Connecting…" : label}
    </button>
  );
}

export function PlaidConnectButton({
  beneficiaryId,
  onConnected,
  bankConnectionId,
}: {
  beneficiaryId: string;
  onConnected: () => void | Promise<void>;
  /** When set, opens Plaid Link in update mode for re-authentication. */
  bankConnectionId?: string;
}) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [returningFromOAuth, setReturningFromOAuth] = useState(false);
  const [resumedContext, setResumedContext] = useState<StoredContext | null>(null);
  const effectiveBankConnectionId = resumedContext?.bankConnectionId ?? bankConnectionId;
  const effectiveBeneficiaryId = resumedContext?.beneficiaryId ?? beneficiaryId;
  const isUpdate = Boolean(effectiveBankConnectionId);

  useEffect(() => {
    let cancelled = false;
    // OAuth bounce-back: Plaid appends ?oauth_state_id=... when the bank redirects to PLAID_REDIRECT_URI.
    // Restore the saved link_token and context so Plaid Link can resume instead of starting over.
    if (typeof window !== "undefined" && window.location.href.includes("oauth_state_id=")) {
      const savedToken = window.sessionStorage.getItem(LINK_TOKEN_STORAGE_KEY);
      const savedCtxJson = window.sessionStorage.getItem(LINK_CONTEXT_STORAGE_KEY);
      if (savedToken) {
        if (savedCtxJson) {
          try {
            setResumedContext(JSON.parse(savedCtxJson) as StoredContext);
          } catch {
            // ignore
          }
        }
        setReturningFromOAuth(true);
        setLinkToken(savedToken);
        return;
      }
    }
    (async () => {
      setError(null);
      setLinkToken(null);
      const res = await fetch("/api/plaid/link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beneficiaryId, bankConnectionId }),
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        if (cancelled) return;
        setError(
          `Expected JSON from /api/plaid/link-token but got “${ct.slice(0, 40)}…”. Check that you are on the same origin as the app (e.g. http://localhost:3000).`,
        );
        return;
      }
      const data = (await res.json().catch(() => ({}))) as {
        link_token?: string;
        linkToken?: string;
        error?: string;
        details?: string;
      };
      if (cancelled) return;
      const token = data.link_token ?? data.linkToken;
      if (!res.ok) {
        setError([data.error, data.details].filter(Boolean).join(" — ") || "Could not start Plaid");
        return;
      }
      if (token) {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(LINK_TOKEN_STORAGE_KEY, token);
          const ctx: StoredContext = { beneficiaryId, bankConnectionId };
          window.sessionStorage.setItem(LINK_CONTEXT_STORAGE_KEY, JSON.stringify(ctx));
        }
        setLinkToken(token);
      } else {
        setError(
          [data.error, data.details].filter(Boolean).join(" — ") ||
            "Plaid did not return a link token. Confirm PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV (sandbox vs production) in your env.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [beneficiaryId, bankConnectionId]);

  const onLinkSuccess = useCallback(
    async (publicToken: string | null) => {
      const clearStorage = () => {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(LINK_TOKEN_STORAGE_KEY);
          window.sessionStorage.removeItem(LINK_CONTEXT_STORAGE_KEY);
        }
      };
      if (isUpdate && effectiveBankConnectionId) {
        const res = await fetch(`/api/plaid/items/${effectiveBankConnectionId}`, {
          method: "PATCH",
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          details?: string;
        };
        if (!res.ok) {
          setError([data.error, data.details].filter(Boolean).join(" — ") || "Could not reconnect");
          return;
        }
        clearStorage();
        await onConnected();
        return;
      }
      if (!publicToken) {
        setError("Plaid Link did not return a token");
        return;
      }
      const res = await fetch("/api/plaid/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token: publicToken, beneficiaryId: effectiveBeneficiaryId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; details?: string };
      if (!res.ok) {
        setError([data.error, data.details].filter(Boolean).join(" — ") || "Could not link bank");
        return;
      }
      clearStorage();
      await onConnected();
    },
    [effectiveBeneficiaryId, effectiveBankConnectionId, isUpdate, onConnected],
  );

  if (error) {
    return (
      <div className="rounded border border-[var(--color-cs-warning-bg)] bg-[var(--color-cs-warning-bg)] p-3 text-center text-xs text-[var(--color-cs-warning)]">
        {error}
      </div>
    );
  }

  if (!linkToken) {
    return (
      <button
        type="button"
        disabled
        className="flex w-full items-center justify-center gap-2 rounded-sm bg-[var(--color-cs-brand)] py-3 text-sm font-medium text-white opacity-60"
      >
        <IconBuildingBank size={18} aria-hidden />
        Preparing secure connection…
      </button>
    );
  }

  return (
    <PlaidLinkInner
      linkToken={linkToken}
      onSuccess={onLinkSuccess}
      label={isUpdate ? "Open Plaid to reconnect" : "Open Plaid Link"}
      autoOpen={returningFromOAuth}
    />
  );
}
