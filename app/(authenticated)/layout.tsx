import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";

function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default async function AuthenticatedGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const display = session.user.name?.trim() || session.user.email || "User";
  return (
    <AuthenticatedShell
      userName={display}
      userInitials={initials(display, session.user.email ?? "")}
    >
      {children}
    </AuthenticatedShell>
  );
}
