import { RequireAppShell } from "@/components/layout/require-app-shell";

export default function AuthenticatedGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAppShell>{children}</RequireAppShell>;
}
