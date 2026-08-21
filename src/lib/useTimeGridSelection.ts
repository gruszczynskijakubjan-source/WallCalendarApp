import { useRef, useState } from "react";

export type TimeGridSelection = { columnIndex: number; startSlot: number; endSlot: number };

const LONG_PRESS_MS = 450;
// If the pointer moves more than this many pixels before the long-press
// timer fires, treat it as a scroll/swipe instead of a hold, and cancel.
const MOVE_CANCEL_THRESHOLD_PX = 10;

/**
 * Tracks a pointer drag across a grid of (column, time-slot) cells to let the
 * user select a time range by dragging, like Google Calendar's day/week view.
 * `slotsPerColumn` slots are assumed to be laid out in a single vertical column
 * per `columnIndex`; a drag is confined to the column where it started.
 *
 * Selection only arms after a short long-press with the pointer held still —
 * a quick swipe (scrolling the time grid) never triggers it, since the timer
 * is cancelled as soon as the pointer moves past a small threshold.
 */
export function useTimeGridSelection(onComplete: (selection: TimeGridSelection) => void) {
  const [selection, setSelection] = useState<TimeGridSelection | null>(null);
  const [armed, setArmed] = useState(false);
  const draggingRef = useRef(false);
  const armedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const pendingRef = useRef<{ columnIndex: number; slot: number } | null>(null);

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  /** Call on pointerdown. Doesn't start the selection yet — arms a long-press timer. */
  function requestSelection(columnIndex: number, slot: number, point: { x: number; y: number }) {
    draggingRef.current = true;
    armedRef.current = false;
    setArmed(false);
    startPointRef.current = point;
    pendingRef.current = { columnIndex, slot };

    clearTimer();
    timerRef.current = setTimeout(() => {
      if (!draggingRef.current || !pendingRef.current) return;
      armedRef.current = true;
      setArmed(true);
      setSelection({
        columnIndex: pendingRef.current.columnIndex,
        startSlot: pendingRef.current.slot,
        endSlot: pendingRef.current.slot,
      });
    }, LONG_PRESS_MS);
  }

  /** Call on pointermove. Before the long-press fires, cancels it on real movement (a swipe/scroll). */
  function updatePointer(columnIndex: number, slot: number, point: { x: number; y: number }) {
    if (!draggingRef.current) return;

    if (!armedRef.current) {
      const start = startPointRef.current;
      if (start) {
        const dx = point.x - start.x;
        const dy = point.y - start.y;
        if (Math.hypot(dx, dy) > MOVE_CANCEL_THRESHOLD_PX) {
          cancelSelection();
        }
      }
      return;
    }

    setSelection((prev) => {
      if (!prev || prev.columnIndex !== columnIndex) return prev;
      return { ...prev, endSlot: slot };
    });
  }

  function endSelection() {
    clearTimer();
    const wasArmed = armedRef.current;
    draggingRef.current = false;
    armedRef.current = false;
    setArmed(false);
    if (wasArmed && selection) onComplete(selection);
    setSelection(null);
  }

  function cancelSelection() {
    clearTimer();
    draggingRef.current = false;
    armedRef.current = false;
    setArmed(false);
    setSelection(null);
  }

  return {
    selection,
    /** True once the long-press has fired and a drag-selection is actively in progress. */
    armed,
    startSelection: requestSelection,
    extendSelection: updatePointer,
    endSelection,
    cancelSelection,
  };
}
