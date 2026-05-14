import { auth } from "@/auth";
import { redirect } from "next/navigation";

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
        Threshold seeds, user oversight, and flagged AI sessions will be built under /admin per core-instructions.
      </p>
      <ul className="mt-4 list-inside list-disc text-sm text-[var(--color-cs-brand)]">
        <li>
          <a className="hover:underline" href="/admin/thresholds">
            System thresholds
          </a>
        </li>
        <li>
          <a className="hover:underline" href="/admin/users">
            Users
          </a>
        </li>
      </ul>
    </>
  );
}
