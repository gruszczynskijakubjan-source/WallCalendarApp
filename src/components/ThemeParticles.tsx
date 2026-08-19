"use client";

import { useEffect, useState } from "react";
import { THEMES, type Theme } from "@/lib/theme";
import { PARTICLE_THEMES, type ParticleConfig } from "@/lib/themeParticles";

type Particle = {
  glyph: string;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
  spin: boolean;
  sway: boolean;
};

function makeParticles(config: ParticleConfig): Particle[] {
  return Array.from({ length: config.count }, () => ({
    glyph: config.glyphs[Math.floor(Math.random() * config.glyphs.length)],
    left: Math.random() * 100,
    size: config.minSize + Math.random() * (config.maxSize - config.minSize),
    duration:
      config.minDuration + Math.random() * (config.maxDuration - config.minDuration),
    delay: -Math.random() * config.maxDuration,
    drift: config.minDrift + Math.random() * (config.maxDrift - config.minDrift),
    opacity: 0.35 + Math.random() * 0.45,
    spin: config.spin,
    sway: config.sway,
  }));
}

/** A per-theme cache of generated particle sets, built lazily on first use. */
const particleCache = new Map<Theme, Particle[]>();

function getParticles(theme: Theme): Particle[] {
  const cached = particleCache.get(theme);
  if (cached) return cached;
  const config = PARTICLE_THEMES[theme];
  const generated = config ? makeParticles(config) : [];
  particleCache.set(theme, generated);
  return generated;
}

/**
 * Gentle floating-particle overlay whose glyphs and motion are themed to the
 * currently active theme (snow, leaves, petals, hearts, confetti, ...).
 */
export default function ThemeParticles() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    function sync() {
      const current = root.getAttribute("data-theme");
      setTheme((THEMES as readonly string[]).includes(current ?? "") ? (current as Theme) : null);
    }

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  if (!theme) return null;
  const particles = getParticles(theme);
  if (particles.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((particle, i) => (
        <span
          key={i}
          className="absolute top-[-10px] leading-none select-none"
          style={{
            left: `${particle.left}%`,
            fontSize: particle.size,
            opacity: particle.opacity,
            animation: `theme-particle-${i % 2 === 0 ? "a" : "b"} ${particle.duration}s linear infinite${
              particle.spin ? `, theme-particle-spin ${particle.duration * 0.6}s linear infinite` : ""
            }${
              particle.sway
                ? `, theme-particle-sway ${(particle.duration * 0.35).toFixed(2)}s ease-in-out infinite`
                : ""
            }`,
            animationDelay: `${particle.delay}s`,
            ["--drift" as string]: `${particle.drift}px`,
          }}
        >
          {particle.glyph}
        </span>
      ))}
      <style>{`
        @keyframes theme-particle-a {
          0% { transform: translate(0, -10px); }
          50% { transform: translate(var(--drift), 50vh); }
          100% { transform: translate(0, 100vh); }
        }
        @keyframes theme-particle-b {
          0% { transform: translate(0, -10px); }
          50% { transform: translate(calc(var(--drift) * -1), 50vh); }
          100% { transform: translate(0, 100vh); }
        }
        @keyframes theme-particle-spin {
          from { rotate: 0deg; }
          to { rotate: 360deg; }
        }
        @keyframes theme-particle-sway {
          0%, 100% { rotate: -12deg; }
          50% { rotate: 12deg; }
        }
      `}</style>
    </div>
  );
}
