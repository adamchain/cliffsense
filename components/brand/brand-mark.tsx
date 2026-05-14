export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cell = size === "sm" ? "h-2 w-2" : size === "lg" ? "h-3 w-3" : "h-2.5 w-2.5";
  const gap = size === "lg" ? "gap-0.5" : "gap-px";
  return (
    <span className={`inline-grid grid-cols-2 grid-rows-2 ${gap}`} aria-hidden>
      <span className={`block ${cell} bg-[#7fba00]`} />
      <span className={`block ${cell} bg-[#00a4ef]`} />
      <span className={`block ${cell} bg-[#ffb900]`} />
      <span className={`block ${cell} bg-[#f25022]`} />
    </span>
  );
}
