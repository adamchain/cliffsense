import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminHomePage() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect("/dashboard");
  }
  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Admin</div>
      <h1 className="mb-2 text-xl font-medium text-[var(--color-cs-text)]">Administration</h1>
      <p className="max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Internal back-office console. Manage users (grant/revoke admin, disable accounts, view-as for
        support — all audit-logged) and review system threshold seeds. Flagged AI sessions are next.
      </p>
      <ul className="mt-4 list-inside list-disc text-sm text-[var(--color-cs-brand)]">
        <li>
          <Link className="hover:underline" href="/admin/thresholds">
            System thresholds
          </Link>
        </li>
        <li>
          <Link className="hover:underline" href="/admin/users">
            Users
          </Link>
        </li>
      </ul>
    </>
  );
}
