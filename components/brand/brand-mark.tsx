import Image from "next/image";

const PX: Record<"sm" | "md" | "lg" | "xl", number> = {
  sm: 18,
  md: 22,
  lg: 28,
  /** Auth split layout / marketing hero */
  xl: 40,
};

export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const px = PX[size];
  return (
    <Image
      src="/cliffsense-icon.png"
      alt=""
      width={px}
      height={px}
      className="inline-block shrink-0 object-contain align-middle"
      sizes={`${px}px`}
    />
  );
}
