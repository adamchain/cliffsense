import Image from "next/image";

const PX: Record<"sm" | "md" | "lg" | "xl", number> = {
  sm: 18,
  md: 22,
  lg: 28,
  /** Auth split layout / marketing hero */
  xl: 40,
};

/**
 * The MyBenefitsPA state-and-check icon. Its navy outline is invisible on the
 * brand-colored header/aside, so pass `onDark` to seat it on a white chip.
 */
export function BrandMark({
  size = "md",
  onDark = false,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  onDark?: boolean;
}) {
  const px = PX[size];
  const img = (
    <Image
      src="/mybenefitspa-icon.png"
      alt=""
      width={px}
      height={px}
      className="inline-block shrink-0 object-contain align-middle"
      sizes={`${px}px`}
    />
  );
  if (!onDark) return img;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md bg-white align-middle shadow-sm"
      style={{ width: px + 8, height: px + 8 }}
    >
      {img}
    </span>
  );
}
