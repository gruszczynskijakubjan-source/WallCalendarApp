// Shared time-grid sizing for Day/Week view. A fixed pixel height (not
// viewport-responsive) is intentional — this is a comfortable touch-target
// row height for a calendar grid, independent of screen size.
export const HOUR_HEIGHT_PX = 64;
export const SLOTS_PER_HOUR = 2;
export const SLOT_MINUTES = 60 / SLOTS_PER_HOUR;
export const SLOT_HEIGHT_PX = HOUR_HEIGHT_PX / SLOTS_PER_HOUR;
