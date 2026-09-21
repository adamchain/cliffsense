import Image from "next/image";

/** Horizontal BeneWatch wordmark (name + state-and-check). */
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
      alt="BeneWatch"
      width={640}
      height={121}
      priority={priority}
      className={className}
    />
  );
}

/** Stacked BeneWatch mark (state-and-check above the wordmark). */
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
      alt="BeneWatch"
      width={503}
      height={387}
      priority={priority}
      className={className}
    />
  );
}
