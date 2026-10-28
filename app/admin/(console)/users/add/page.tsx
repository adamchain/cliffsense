import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { AddUserForm } from "./add-user-form";

export default async function AdminAddUserPage() {
  await requireAdmin();

  return (
    <>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-medium">Add user</h1>
        <Link
          href="/admin/users"
          className="text-[12px] font-medium text-[var(--color-cs-brand)] hover:underline"
        >
          ← Back to users
        </Link>
      </div>
      <p className="mb-4 max-w-prose text-[13px] text-[var(--color-cs-text-secondary)]">
        Create an account by hand and set it up. Leave the password blank to have a temporary one
        generated — the new user signs in with the emailed code and sets their own password.
      </p>
      <AddUserForm />
    </>
  );
}
