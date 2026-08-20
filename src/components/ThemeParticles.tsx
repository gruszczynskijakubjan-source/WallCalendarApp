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
      {particles.map((particle, i) => {
        // Safari 12 has no standalone `rotate`/`scale` CSS properties, so any
        // rotation must ride the same `transform:` value as the fall/drift
        // animation rather than run as a second, independent animation.
        const variant = i % 2 === 0 ? "a" : "b";
        const fallKeyframe = particle.spin
          ? `theme-particle-${variant}-spin`
          : particle.sway
            ? `theme-particle-${variant}-sway`
            : `theme-particle-${variant}`;
        const spinDuration = particle.duration * 0.6;
        const swayDuration = particle.duration * 0.35;

        return (
          <span
            key={i}
            className="absolute top-[-10px] leading-none select-none"
            style={{
              left: `${particle.left}%`,
              fontSize: particle.size,
              opacity: particle.opacity,
              animation: `${fallKeyframe} ${particle.duration}s linear infinite`,
              animationDelay: `${particle.delay}s`,
              ["--drift" as string]: `${particle.drift}px`,
              ["--spin-duration" as string]: `${spinDuration}s`,
              ["--sway-duration" as string]: `${swayDuration}s`,
            }}
          >
            {particle.glyph}
          </span>
        );
      })}
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
        @keyframes theme-particle-a-spin {
          0% { transform: translate(0, -10px) rotate(0deg); }
          50% { transform: translate(var(--drift), 50vh) rotate(180deg); }
          100% { transform: translate(0, 100vh) rotate(360deg); }
        }
        @keyframes theme-particle-b-spin {
          0% { transform: translate(0, -10px) rotate(0deg); }
          50% { transform: translate(calc(var(--drift) * -1), 50vh) rotate(180deg); }
          100% { transform: translate(0, 100vh) rotate(360deg); }
        }
        @keyframes theme-particle-a-sway {
          0% { transform: translate(0, -10px) rotate(-12deg); }
          25% { transform: translate(calc(var(--drift) * 0.5), 25vh) rotate(12deg); }
          50% { transform: translate(var(--drift), 50vh) rotate(-12deg); }
          75% { transform: translate(calc(var(--drift) * 0.5), 75vh) rotate(12deg); }
          100% { transform: translate(0, 100vh) rotate(-12deg); }
        }
        @keyframes theme-particle-b-sway {
          0% { transform: translate(0, -10px) rotate(-12deg); }
          25% { transform: translate(calc(var(--drift) * -0.5), 25vh) rotate(12deg); }
          50% { transform: translate(calc(var(--drift) * -1), 50vh) rotate(-12deg); }
          75% { transform: translate(calc(var(--drift) * -0.5), 75vh) rotate(12deg); }
          100% { transform: translate(0, 100vh) rotate(-12deg); }
        }
      `}</style>
    </div>
  );
}
