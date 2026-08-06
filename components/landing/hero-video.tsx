"use client";

import { useEffect, useState } from "react";

const SOURCES = ["/videos/hero-1.mp4", "/videos/hero-2.mp4"];

/**
 * Background for the landing hero: two looping clips that slowly crossfade
 * between each other. A light left-to-right gradient keeps the left-aligned
 * copy legible while the video shows through on the right.
 */
export function HeroVideo() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a === 0 ? 1 : 0));
    }, 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {SOURCES.map((src, i) => (
        <video
          key={src}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[2500ms] ease-in-out ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {/* Legibility overlays: solid-ish on the left, clearer on the right. */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-cs-surface)] via-[var(--color-cs-surface)]/85 to-[var(--color-cs-surface)]/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-cs-surface)] via-transparent to-[var(--color-cs-surface)]/40" />
    </div>
  );
}
