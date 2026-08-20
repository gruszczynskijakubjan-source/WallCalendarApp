"use client";

import { useEffect, useState } from "react";

/** Soft, slowly drifting sunlight glare overlay, shown only in the summer theme. */
export default function SummerSunGlare() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    function sync() {
      setActive(root.getAttribute("data-theme") === "summer");
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  if (!active) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {/* Wide, soft rays fanning out from the corner. Uses a precomputed
          CSS variable instead of color-mix() — Safari 12 doesn't support
          color-mix(), and an invalid value inside a shorthand `background`
          drops the whole declaration, making this invisible there. */}
      <div className="absolute -top-[26.25rem] -right-[26.25rem] h-[52.5rem] w-[52.5rem] animate-[sun-glow_10s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,_var(--accent-gold-glow-22)_0%,_transparent_60%)]" />
      {/* The sun itself, tucked into the corner. */}
      <div className="absolute -top-32 -right-32 h-64 w-64 animate-[sun-glow_9s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,_var(--accent-gold-glow-65)_0%,_transparent_70%)]" />
      <div className="absolute top-1/4 left-1/3 h-2 w-2 animate-[sun-sparkle_5s_ease-in-out_infinite] rounded-full bg-white/80" />
      <div className="absolute top-1/2 left-2/3 h-1.5 w-1.5 animate-[sun-sparkle_6.5s_ease-in-out_infinite] rounded-full bg-white/70" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-2/3 left-1/4 h-1 w-1 animate-[sun-sparkle_7.5s_ease-in-out_infinite] rounded-full bg-white/60" style={{ animationDelay: "3s" }} />
      <style>{`
        @keyframes sun-glow {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.08); opacity: 0.8; }
        }
        @keyframes sun-sparkle {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          50% { opacity: 1; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
