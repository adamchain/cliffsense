import Link from "next/link";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import Beneficiary from "@/lib/db/models/Beneficiary";
import Invite from "@/lib/db/models/Invite";
import { AcceptButton } from "./accept-button";

const ROLE_LABEL: Record<string, string> = { co_manager: "co-manager", viewer: "viewer" };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg px-6 py-16 font-sans text-[var(--color-cs-text)]">
      <h1 className="text-xl font-medium">MyBenefitsPA invitation</h1>
      <div className="mt-4 rounded border border-[var(--color-cs-border)] bg-white p-5 text-[13px] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default async function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await connectDB();
  const invite = await Invite.findOne({ token }).lean();

  if (!invite || invite.status !== "pending" || invite.expiresAt.getTime() < Date.now()) {
    return (
      <Shell>
        <p className="text-[var(--color-cs-text-secondary)]">
          This invitation is invalid, already used, or expired. Ask the person who invited you to send a new one.
        </p>
        <Link href="/" className="mt-3 inline-block text-[var(--color-cs-brand)] hover:underline">
          Go home
        </Link>
      </Shell>
    );
  }

  const ben = await Beneficiary.findById(invite.beneficiaryId).select("firstName lastName").lean();
  const name = `${ben?.firstName ?? ""} ${ben?.lastName ?? ""}`.trim() || "a beneficiary";
  const roleLabel = ROLE_LABEL[invite.role] ?? invite.role;

  const session = await auth();

  if (!session?.user?.id) {
    const callback = encodeURIComponent(`/invite/${token}`);
    return (
      <Shell>
        <p>
          You&apos;ve been invited to help monitor <strong>{name}</strong> as a {roleLabel}.
        </p>
        <p className="mt-3 text-[var(--color-cs-text-secondary)]">
          Sign in or create an account using <strong>{invite.email}</strong> to accept.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href={`/auth/signin?callbackUrl=${callback}`}
            className="rounded-sm bg-[var(--color-cs-brand)] px-4 py-2 text-sm text-white hover:bg-[var(--color-cs-brand-hover)]"
          >
            Sign in
          </Link>
          <Link
            href={`/auth/signup?callbackUrl=${callback}`}
            className="rounded-sm border border-[var(--color-cs-border)] px-4 py-2 text-sm hover:bg-[var(--color-cs-nav-hover)]"
          >
            Create account
          </Link>
        </div>
      </Shell>
    );
  }

  if (session.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <Shell>
        <p>
          This invitation was sent to <strong>{invite.email}</strong>, but you&apos;re signed in as{" "}
          <strong>{session.user.email}</strong>.
        </p>
        <p className="mt-3 text-[var(--color-cs-text-secondary)]">
          Sign out and sign back in with {invite.email} to accept.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <p>
        You&apos;ve been invited to help monitor <strong>{name}</strong> as a {roleLabel}.
      </p>
      <p className="mt-3 text-[var(--color-cs-text-secondary)]">
        Accepting gives your account ({session.user.email}) {invite.role === "viewer" ? "read-only" : "edit"}{" "}
        access to this beneficiary&apos;s thresholds, alerts, and activity.
      </p>
      <div className="mt-4">
        <AcceptButton token={token} />
      </div>
    </Shell>
  );
}
