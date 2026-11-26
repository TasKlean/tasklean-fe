/**
 * The two ways a board is laid out. Types only, so nothing of it reaches a
 * bundle and the pills in the browser can read the list.
 */

export const BOARD_VIEWS = ["list", "cards"] as const;

export type BoardView = (typeof BOARD_VIEWS)[number];

// A list reads fastest and says the most per row, so it is what a board opens
// on; cards are for a household that puts photos on its tasks.
export const DEFAULT_VIEW: BoardView = "list";
