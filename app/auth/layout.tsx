import { Suspense } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen bg-[var(--color-cs-surface)]" />}>{children}</Suspense>;
}
