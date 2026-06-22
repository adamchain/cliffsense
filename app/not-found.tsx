import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-cs-surface)] px-6 text-center text-[var(--color-cs-text)]">
      <Link href="/" className="mb-6 flex items-center gap-2 text-sm font-medium text-[var(--color-cs-brand)]">
        <BrandMark size="sm" />
        MyBenefitsPA
      </Link>
      <h1 className="text-2xl font-medium">Page not found</h1>
      <p className="mt-2 max-w-md text-[13px] text-[var(--color-cs-text-secondary)]">
        That URL does not exist or may have moved. Check the address or go home to continue.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-sm bg-[var(--color-cs-brand)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-cs-brand-hover)]"
      >
        Back to home
      </Link>
    </div>
  );
}
