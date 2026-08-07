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
      {/* Dark legibility overlays — kept light enough that the video shows
          through, with a bit more shade on the left to hold the copy. */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-black/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25" />
    </div>
  );
}
