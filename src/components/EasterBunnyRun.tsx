"use client";

import { useEffect, useRef, useState } from "react";
import {
  BUNNY_FRAME_A,
  BUNNY_FRAME_B,
  PIXEL_SIZE,
  spriteBoxShadow,
} from "@/lib/bunnySprite";

const MIN_DELAY_MS = 30_000;
const MAX_DELAY_MS = 90_000;
const RUN_DURATION_MS = 9000;
const TREAT_COUNT = 5;
const HOP_FRAME_MS = 180;
const SPRITE_WIDTH = 10 * PIXEL_SIZE;
const SPRITE_HEIGHT = 10 * PIXEL_SIZE;

type Treat = {
  glyph: string;
  left: number; // percent along the run, 0-100
  collectAt: number; // ms into the run when the bunny reaches it
};

function makeTreats(): Treat[] {
  return Array.from({ length: TREAT_COUNT }, (_, i) => {
    const left = 8 + (i / (TREAT_COUNT - 1)) * 84 + (Math.random() * 4 - 2);
    return {
      glyph: Math.random() < 0.5 ? "🍐" : "🥚",
      left,
      collectAt: (left / 100) * RUN_DURATION_MS,
    };
  });
}

/** Occasional easter-egg animation: a bunny hops across the bottom of the screen collecting treats. */
export default function EasterBunnyRun() {
  const [active, setActive] = useState(false);
  const [running, setRunning] = useState(false);
  const [treats, setTreats] = useState<Treat[]>([]);
  const [collected, setCollected] = useState<Set<number>>(new Set());
  const [hopFrame, setHopFrame] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    function sync() {
      setActive(root.getAttribute("data-theme") === "easter");
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    function scheduleRun() {
      const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
      timeoutRef.current = setTimeout(() => {
        setTreats(makeTreats());
        setCollected(new Set());
        setRunning(true);
        setTimeout(() => setRunning(false), RUN_DURATION_MS);
        scheduleRun();
      }, delay);
    }

    scheduleRun();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [active]);

  useEffect(() => {
    if (!running) return;
    const timers = treats.map((treat, i) =>
      setTimeout(() => {
        setCollected((prev) => new Set(prev).add(i));
      }, treat.collectAt),
    );
    return () => timers.forEach(clearTimeout);
  }, [running, treats]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setHopFrame((f) => (f === 0 ? 1 : 0));
    }, HOP_FRAME_MS);
    return () => clearInterval(interval);
  }, [running]);

  if (!active || !running) return null;

  const frame = hopFrame === 0 ? BUNNY_FRAME_A : BUNNY_FRAME_B;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-2 z-40 h-10">
      {treats.map((treat, i) => (
        <span
          key={i}
          className="absolute bottom-0 text-xl transition-opacity duration-300"
          style={{
            left: `${treat.left}%`,
            opacity: collected.has(i) ? 0 : 1,
          }}
        >
          {treat.glyph}
        </span>
      ))}
      <div
        className="absolute bottom-0 left-0"
        style={{
          animation: `bunny-run ${RUN_DURATION_MS}ms linear forwards`,
        }}
      >
        <div
          style={{
            width: SPRITE_WIDTH,
            height: SPRITE_HEIGHT,
            position: "relative",
            animation: `bunny-hop ${HOP_FRAME_MS * 2}ms ease-in-out infinite`,
          }}
        >
          <div
            style={{
              position: "absolute",
              width: PIXEL_SIZE,
              height: PIXEL_SIZE,
              boxShadow: spriteBoxShadow(frame),
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes bunny-run {
          from { transform: translateX(-5vw); }
          to { transform: translateX(105vw); }
        }
        @keyframes bunny-hop {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
