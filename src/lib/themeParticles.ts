import type { Theme } from "@/lib/theme";

export type ParticleConfig = {
  /** Emoji or short glyph rendered per particle. Multiple = picked at random per particle. */
  glyphs: string[];
  count: number;
  minSize: number;
  maxSize: number;
  minDuration: number;
  maxDuration: number;
  minDrift: number;
  maxDrift: number;
  spin: boolean;
  /** Gentle side-to-side swaying as it falls, instead of a full rotation. */
  sway: boolean;
};

export const PARTICLE_THEMES: Partial<Record<Theme, ParticleConfig>> = {
  winter: {
    glyphs: ["❄"],
    count: 18,
    minSize: 10,
    maxSize: 18,
    minDuration: 26,
    maxDuration: 42,
    minDrift: 15,
    maxDrift: 35,
    spin: false,
    sway: true,
  },
  autumn: {
    glyphs: ["🍂", "🍁"],
    count: 1,
    minSize: 28,
    maxSize: 38,
    minDuration: 22,
    maxDuration: 34,
    minDrift: 30,
    maxDrift: 70,
    spin: false,
    sway: true,
  },
  christmas: {
    glyphs: ["❄"],
    count: 18,
    minSize: 10,
    maxSize: 18,
    minDuration: 26,
    maxDuration: 42,
    minDrift: 15,
    maxDrift: 35,
    spin: false,
    sway: true,
  },
  valentines: {
    glyphs: ["💗", "💕"],
    count: 20,
    minSize: 12,
    maxSize: 18,
    minDuration: 14,
    maxDuration: 24,
    minDrift: 20,
    maxDrift: 60,
    spin: false,
    sway: false,
  },
  mayday: {
    glyphs: ["🌷", "🍃"],
    count: 20,
    minSize: 12,
    maxSize: 18,
    minDuration: 14,
    maxDuration: 24,
    minDrift: 40,
    maxDrift: 90,
    spin: true,
    sway: false,
  },
};
