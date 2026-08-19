"use client";

import { useEffect, useState } from "react";

const BULB_COLORS = ["#e0453f", "#f5c542", "#3fa3d9", "#4caf6e", "#e06fc2"];
const BULB_SPACING_PX = 34;

type Bulb = {
  color: string;
  duration: number;
  delay: number;
};

function makeBulbs(count: number): Bulb[] {
  return Array.from({ length: count }, (_, i) => ({
    color: BULB_COLORS[i % BULB_COLORS.length],
    duration: 1.6 + Math.random() * 1.4,
    delay: Math.random() * 2,
  }));
}

/** A string of multicolour lights along the top of the page, each twinkling on its own cycle. */
export default function ChristmasGarland() {
  const [active, setActive] = useState(false);
  const [bulbs, setBulbs] = useState<Bulb[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    function sync() {
      setActive(root.getAttribute("data-theme") === "christmas");
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function updateBulbs() {
      const count = Math.ceil(window.innerWidth / BULB_SPACING_PX) + 1;
      setBulbs(makeBulbs(count));
    }
    updateBulbs();
    window.addEventListener("resize", updateBulbs);
    return () => window.removeEventListener("resize", updateBulbs);
  }, []);

  if (!active || bulbs.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-40 h-3 overflow-hidden"
    >
      <svg
        className="absolute inset-x-0 top-0 h-3 w-full"
        preserveAspectRatio="none"
        viewBox={`0 0 ${bulbs.length * BULB_SPACING_PX} 12`}
      >
        <path
          d={`M 0 2 ${bulbs
            .map((_, i) => `Q ${i * BULB_SPACING_PX + BULB_SPACING_PX / 2} 10 ${(i + 1) * BULB_SPACING_PX} 2`)
            .join(" ")}`}
          fill="none"
          stroke="#5a5a5a"
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>
      {bulbs.map((bulb, i) => (
        <span
          key={i}
          className="absolute top-[6px] h-2 w-2 -translate-x-1/2 rounded-full"
          style={{
            left: i * BULB_SPACING_PX,
            background: bulb.color,
            boxShadow: `0 0 4px ${bulb.color}`,
            animation: `garland-twinkle ${bulb.duration}s ease-in-out infinite`,
            animationDelay: `${bulb.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes garland-twinkle {
          0%, 100% { opacity: 0.35; transform: translateX(-50%) scale(0.85); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.15); }
        }
      `}</style>
    </div>
  );
}
