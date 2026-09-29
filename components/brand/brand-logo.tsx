import Image from "next/image";

/** Horizontal Bene-Watch wordmark (name + state-and-check). */
export function BrandLogo({
  className = "h-8 w-auto",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/benewatch-logo.png"
      alt="Bene-Watch"
      width={640}
      height={121}
      priority={priority}
      className={className}
    />
  );
}

/** Stacked Bene-Watch mark (state-and-check above the wordmark). */
export function BrandStackedMark({
  className = "h-16 w-auto",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/benewatch-mark.png"
      alt="Bene-Watch"
      width={503}
      height={387}
      priority={priority}
      className={className}
    />
  );
}
