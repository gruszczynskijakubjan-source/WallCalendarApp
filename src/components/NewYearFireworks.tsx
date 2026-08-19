"use client";

import { useEffect, useRef, useState } from "react";

const COLORS = ["#f5c542", "#ff6f61", "#4fd1c5", "#b98ee0", "#ffffff"];
const SPARKS_PER_BURST = 14;
const BURST_INTERVAL_MS = 1800;
const BURST_LIFETIME_MS = 1100;

type Spark = {
  angle: number;
  distance: number;
  color: string;
};

type Burst = {
  id: number;
  x: number;
  y: number;
  sparks: Spark[];
};

function makeBurst(id: number): Burst {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    id,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 45,
    sparks: Array.from({ length: SPARKS_PER_BURST }, (_, i) => ({
      angle: (360 / SPARKS_PER_BURST) * i + Math.random() * 10,
      distance: 60 + Math.random() * 50,
      color,
    })),
  };
}

/** Periodic firework bursts, shown only in the New Year's theme. */
export default function NewYearFireworks() {
  const [active, setActive] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const nextIdRef = useRef(0);

  useEffect(() => {
    const root = document.documentElement;
    function sync() {
      setActive(root.getAttribute("data-theme") === "newyear");
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      const id = nextIdRef.current++;
      setBursts((prev) => [...prev, makeBurst(id)]);
      setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== id));
      }, BURST_LIFETIME_MS);
    }, BURST_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="absolute"
          style={{ left: `${burst.x}%`, top: `${burst.y}%` }}
        >
          {burst.sparks.map((spark, i) => (
            <span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full"
              style={{
                background: spark.color,
                boxShadow: `0 0 6px ${spark.color}`,
                animation: `firework-spark ${BURST_LIFETIME_MS}ms ease-out forwards`,
                ["--angle" as string]: `${spark.angle}deg`,
                ["--distance" as string]: `${spark.distance}px`,
              }}
            />
          ))}
        </div>
      ))}
      <style>{`
        @keyframes firework-spark {
          0% {
            transform: rotate(var(--angle)) translateX(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--angle)) translateX(var(--distance)) scale(0.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
