"use client";

import { useEffect, useState } from "react";

const BLADE_COUNT = 60;

function makeBlades() {
  return Array.from({ length: BLADE_COUNT }, (_, i) => ({
    left: (i / BLADE_COUNT) * 100 + (Math.random() * 1.2 - 0.6),
    height: 14 + Math.random() * 16,
    delay: Math.random() * 1.2,
    tilt: Math.random() * 10 - 5,
  }));
}

/**
 * A soft strip of grass blades that grow in along the bottom of the page for
 * the given theme(s). `themes` is a comma-separated list (not an array) so it
 * stays a stable primitive across renders for the effect's dependency array.
 */
export default function SpringGrass({ themes }: { themes: string }) {
  const [active, setActive] = useState(false);
  const [blades] = useState(makeBlades);

  useEffect(() => {
    const root = document.documentElement;
    const themeList = themes.split(",");
    function sync() {
      setActive(themeList.includes(root.getAttribute("data-theme") ?? ""));
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [themes]);

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-8 overflow-hidden"
    >
      {blades.map((blade, i) => (
        <span
          key={i}
          className="absolute bottom-0 origin-bottom rounded-t-full bg-accent-teal"
          style={{
            left: `${blade.left}%`,
            width: 3,
            height: blade.height,
            rotate: `${blade.tilt}deg`,
            transform: "scaleY(0)",
            animation:
              "spring-grass-grow 1.1s ease-out forwards, spring-grass-sway 3.5s ease-in-out infinite",
            animationDelay: `${blade.delay}s, ${blade.delay + 1.1}s`,
            opacity: 0.55,
          }}
        />
      ))}
      <style>{`
        @keyframes spring-grass-grow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes spring-grass-sway {
          0%, 100% { rotate: -4deg; }
          50% { rotate: 4deg; }
        }
      `}</style>
    </div>
  );
}
