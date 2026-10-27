"use client";

export function AdminSignOut() {
  async function signOut() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="rounded-lg border border-[var(--color-cs-border)] px-3 py-1.5 text-[13px] font-semibold text-[var(--color-cs-text)] hover:bg-white"
    >
      Sign out
    </button>
  );
}
