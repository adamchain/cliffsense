export const metadata = { title: "Admin · Bene-Watch" };

/**
 * Visual frame only. Auth lives in the console layout and on /admin/login so
 * the sign-in page is not wrapped in the main app.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-cs-surface)] text-[var(--color-cs-text)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
