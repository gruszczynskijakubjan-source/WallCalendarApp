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
            transform: `rotate(${blade.tilt}deg) scaleY(0)`,
            animation:
              "spring-grass-grow 1.1s ease-out forwards, spring-grass-sway 3.5s ease-in-out infinite",
            animationDelay: `${blade.delay}s, ${blade.delay + 1.1}s`,
            opacity: 0.55,
            // Custom property carries the blade's fixed tilt so the two
            // animations below can each layer their own transform on top of
            // it without clobbering one another (Safari 12 has no standalone
            // `rotate`/`scale` CSS properties, so both must ride one
            // `transform` value per keyframe step).
            ["--tilt" as string]: `${blade.tilt}deg`,
          }}
        />
      ))}
      <style>{`
        @keyframes spring-grass-grow {
          from { transform: rotate(var(--tilt)) scaleY(0); }
          to { transform: rotate(var(--tilt)) scaleY(1); }
        }
        @keyframes spring-grass-sway {
          0%, 100% { transform: rotate(calc(var(--tilt) - 4deg)) scaleY(1); }
          50% { transform: rotate(calc(var(--tilt) + 4deg)) scaleY(1); }
        }
      `}</style>
    </div>
  );
}
