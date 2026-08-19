import { useRef } from "react";

const SWIPE_THRESHOLD_PX = 50;
const MAX_VERTICAL_DRIFT_PX = 75;

/** Attach to a container's touch handlers to detect a horizontal swipe gesture. */
export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (startX.current === null || startY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - startX.current;
    const deltaY = e.changedTouches[0].clientY - startY.current;

    startX.current = null;
    startY.current = null;

    if (Math.abs(deltaY) > MAX_VERTICAL_DRIFT_PX) return;
    if (deltaX <= -SWIPE_THRESHOLD_PX) onSwipeLeft();
    else if (deltaX >= SWIPE_THRESHOLD_PX) onSwipeRight();
  }

  return { onTouchStart, onTouchEnd };
}
