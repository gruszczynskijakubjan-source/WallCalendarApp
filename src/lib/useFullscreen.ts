"use client";

import { useCallback, useEffect, useState } from "react";

/** Tracks and toggles browser fullscreen for the whole page (hides the browser chrome). */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof document.documentElement.requestFullscreen === "function");
    function sync() {
      setIsFullscreen(document.fullscreenElement != null);
    }
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen();
    }
  }, []);

  return { isFullscreen, supported, toggle };
}
