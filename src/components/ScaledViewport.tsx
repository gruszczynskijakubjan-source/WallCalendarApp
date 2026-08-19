"use client";

import { useLayoutEffect, useRef, useState } from "react";

// The layout is designed around this reference width (landscape) — font
// sizes, paddings and gaps in every component are tuned for a canvas this
// wide. Rather than pick a fixed design height too (which leaves empty bars
// or crops content whenever a real device's aspect ratio doesn't match), we
// derive the design height from the real viewport's aspect ratio every time,
// then scale that canvas uniformly to fill the viewport exactly. This keeps
// element proportions/scale consistent across devices while always filling
// the screen with no letterboxing.
const LANDSCAPE_DESIGN_WIDTH = 1280;
const PORTRAIT_DESIGN_WIDTH = 800;

export default function ScaledViewport({
  children,
}: {
  children: (portrait: boolean) => React.ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<{
    scale: number;
    width: number;
    height: number;
    portrait: boolean;
  } | null>(null);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    function recalc() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const portrait = vh > vw;
      const designWidth = portrait ? PORTRAIT_DESIGN_WIDTH : LANDSCAPE_DESIGN_WIDTH;
      const designHeight = designWidth * (vh / vw);
      const scale = vw / designWidth;
      setTransform({ scale, width: designWidth, height: designHeight, portrait });
    }

    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("orientationchange", recalc);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("orientationchange", recalc);
    };
  }, []);

  return (
    <div
      ref={outerRef}
      className="h-screen w-screen overflow-hidden bg-background"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {transform && (
        <div
          style={{
            width: transform.width,
            height: transform.height,
            transform: `scale(${transform.scale})`,
            transformOrigin: "center center",
            flexShrink: 0,
          }}
        >
          {children(transform.portrait)}
        </div>
      )}
    </div>
  );
}
