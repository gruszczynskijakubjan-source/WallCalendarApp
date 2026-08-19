import { useRef, useState } from "react";

export type TimeGridSelection = { columnIndex: number; startSlot: number; endSlot: number };

/**
 * Tracks a pointer drag across a grid of (column, time-slot) cells to let the
 * user select a time range by dragging, like Google Calendar's day/week view.
 * `slotsPerColumn` slots are assumed to be laid out in a single vertical column
 * per `columnIndex`; a drag is confined to the column where it started.
 */
export function useTimeGridSelection(onComplete: (selection: TimeGridSelection) => void) {
  const [selection, setSelection] = useState<TimeGridSelection | null>(null);
  const draggingRef = useRef(false);

  function startSelection(columnIndex: number, slot: number) {
    draggingRef.current = true;
    setSelection({ columnIndex, startSlot: slot, endSlot: slot });
  }

  function extendSelection(columnIndex: number, slot: number) {
    if (!draggingRef.current) return;
    setSelection((prev) => {
      if (!prev || prev.columnIndex !== columnIndex) return prev;
      return { ...prev, endSlot: slot };
    });
  }

  function endSelection() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setSelection(null);
    if (selection) onComplete(selection);
  }

  function cancelSelection() {
    draggingRef.current = false;
    setSelection(null);
  }

  return { selection, startSelection, extendSelection, endSelection, cancelSelection };
}
