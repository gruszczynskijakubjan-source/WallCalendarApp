"use client";

import { useLayoutEffect, useState } from "react";

// The layout is designed around this reference width (landscape) — font
// sizes, paddings and gaps in every component use Tailwind's default rem-
// based utility scale (text-2xl, p-4, gap-2, ...), which all cascade from
// the root <html> font-size. Rather than scale the whole page visually via
// `transform: scale()` (which breaks native touch-scrolling inside any
// descendant overflow-y-auto container on Safari 12/iOS — confirmed on a
// real device), we instead scale the root font-size itself: every rem-based
// utility class then resolves to a proportionally larger/smaller real pixel
// value, with no transform and no fixed-size wrapper, so descendants
// participate in the real DOM layout and scroll chain like normal.
const LANDSCAPE_REFERENCE_WIDTH = 1280;
const PORTRAIT_REFERENCE_WIDTH = 800;
const BASE_FONT_SIZE_PX = 16;
const MIN_SCALE = 0.75;
const MAX_SCALE = 1.4;

export default function ScaledViewport({
  children,
}: {
  children: (portrait: boolean) => React.ReactNode;
}) {
  const [portrait, setPortrait] = useState<boolean | null>(null);

  useLayoutEffect(() => {
    function recalc() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isPortrait = vh > vw;
      const referenceWidth = isPortrait ? PORTRAIT_REFERENCE_WIDTH : LANDSCAPE_REFERENCE_WIDTH;
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, vw / referenceWidth));
      document.documentElement.style.fontSize = `${BASE_FONT_SIZE_PX * scale}px`;
      setPortrait(isPortrait);
    }

    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("orientationchange", recalc);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("orientationchange", recalc);
    };
  }, []);

  if (portrait === null) return null;
  return <>{children(portrait)}</>;
}
