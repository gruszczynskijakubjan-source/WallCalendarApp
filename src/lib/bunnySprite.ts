// Two-frame pixel-art bunny sprite, hand-authored on a 12x10 grid. Rendered
// via a single 1px div whose box-shadow paints every "on" pixel — no image
// asset needed. Frame B has ears swept back, legs tucked, and the whole body
// shifted up slightly, giving a crouch-and-leap hop cycle when alternated.

export const PIXEL_SIZE = 4;

const WHITE = "#ffffff";
const PINK = "#f4a6c1";
const BLACK = "#2c2c2c";

// [x, y, color] — origin top-left, one unit = PIXEL_SIZE px.
export const BUNNY_FRAME_A: [number, number, string][] = [
  // ears (upright)
  [2, 0, WHITE], [3, 0, WHITE],
  [7, 0, WHITE], [8, 0, WHITE],
  [2, 1, PINK], [3, 1, WHITE],
  [7, 1, WHITE], [8, 1, PINK],
  [2, 2, WHITE], [3, 2, WHITE],
  [7, 2, WHITE], [8, 2, WHITE],
  // head
  [2, 3, WHITE], [3, 3, WHITE], [4, 3, WHITE], [5, 3, WHITE], [6, 3, WHITE], [7, 3, WHITE], [8, 3, WHITE],
  [2, 4, WHITE], [3, 4, BLACK], [4, 4, WHITE], [5, 4, WHITE], [6, 4, WHITE], [7, 4, BLACK], [8, 4, WHITE],
  [2, 5, WHITE], [3, 5, WHITE], [4, 5, WHITE], [5, 5, PINK], [6, 5, WHITE], [7, 5, WHITE], [8, 5, WHITE],
  // body
  [1, 6, WHITE], [2, 6, WHITE], [3, 6, WHITE], [4, 6, WHITE], [5, 6, WHITE], [6, 6, WHITE], [7, 6, WHITE], [8, 6, WHITE], [9, 6, WHITE],
  [1, 7, WHITE], [2, 7, WHITE], [3, 7, WHITE], [4, 7, WHITE], [5, 7, WHITE], [6, 7, WHITE], [7, 7, WHITE], [8, 7, WHITE], [9, 7, WHITE],
  [2, 8, WHITE], [3, 8, WHITE], [4, 8, WHITE], [5, 8, WHITE], [6, 8, WHITE], [7, 8, WHITE], [8, 8, WHITE],
  // legs (extended, mid-stride)
  [1, 9, BLACK], [2, 9, BLACK],
  [8, 9, BLACK], [9, 9, BLACK],
];

export const BUNNY_FRAME_B: [number, number, string][] = [
  // ears (swept back)
  [3, 1, WHITE], [4, 1, WHITE],
  [7, 1, WHITE], [8, 1, WHITE],
  [3, 2, PINK], [4, 2, WHITE],
  [7, 2, WHITE], [8, 2, PINK],
  // head (lower, crouched)
  [2, 3, WHITE], [3, 3, WHITE], [4, 3, WHITE], [5, 3, WHITE], [6, 3, WHITE], [7, 3, WHITE], [8, 3, WHITE],
  [2, 4, WHITE], [3, 4, BLACK], [4, 4, WHITE], [5, 4, WHITE], [6, 4, WHITE], [7, 4, BLACK], [8, 4, WHITE],
  [2, 5, WHITE], [3, 5, WHITE], [4, 5, WHITE], [5, 5, PINK], [6, 5, WHITE], [7, 5, WHITE], [8, 5, WHITE],
  // body (compressed, tucked)
  [1, 6, WHITE], [2, 6, WHITE], [3, 6, WHITE], [4, 6, WHITE], [5, 6, WHITE], [6, 6, WHITE], [7, 6, WHITE], [8, 6, WHITE], [9, 6, WHITE],
  [1, 7, WHITE], [2, 7, WHITE], [3, 7, WHITE], [4, 7, WHITE], [5, 7, WHITE], [6, 7, WHITE], [7, 7, WHITE], [8, 7, WHITE], [9, 7, WHITE],
  [2, 8, WHITE], [3, 8, WHITE], [4, 8, WHITE], [5, 8, WHITE], [6, 8, WHITE], [7, 8, WHITE], [8, 8, WHITE],
  // legs (tucked under body, crouched)
  [2, 9, BLACK], [3, 9, BLACK],
  [7, 9, BLACK], [8, 9, BLACK],
];

export function spriteBoxShadow(frame: [number, number, string][]): string {
  return frame.map(([x, y, color]) => `${x * PIXEL_SIZE}px ${y * PIXEL_SIZE}px 0 0 ${color}`).join(", ");
}
