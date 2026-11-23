/**
 * A press held in one place, which is how a phone asks for something a row
 * has no width to offer a control for.
 *
 * Touch and pen only: a mouse has a press of its own to use, and holding one
 * down is how a reader selects text or asks for the browser's own menu.
 */

import { useEffect, useRef, type MouseEvent, type PointerEvent } from "react";

export type LongPressHandlers = {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
  onClickCapture: (event: MouseEvent<HTMLElement>) => void;
  onContextMenu: (event: MouseEvent<HTMLElement>) => void;
};

// Long enough that an ordinary tap never reaches it, short enough that a
// reader holding on has not yet decided nothing is going to happen.
const HOLD_MS = 500;

// A finger never holds still, and every scroll starts as a press.
const SLACK = 10;

/**
 * Runs the hold that opens something, and swallows what the hold ends in.
 *
 * @param onHold What the hold asks for, run once the finger has been still
 * for long enough.
 * @returns Handlers to spread onto the element being held.
 */
export function useLongPress(onHold: () => void): LongPressHandlers {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const from = useRef<{ x: number; y: number } | null>(null);
  const held = useRef(false);

  /** Gives up on the press in flight, whatever ended it. */
  function stop() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    from.current = null;
  }

  useEffect(() => () => stop(), []);

  return {
    onPointerDown(event) {
      held.current = false;
      if (event.pointerType === "mouse") return;

      from.current = { x: event.clientX, y: event.clientY };
      timer.current = setTimeout(() => {
        held.current = true;
        stop();
        onHold();
      }, HOLD_MS);
    },

    onPointerMove(event) {
      const start = from.current;
      if (!start) return;

      const moved = Math.abs(event.clientX - start.x) > SLACK;
      if (moved || Math.abs(event.clientY - start.y) > SLACK) stop();
    },

    onPointerUp: stop,
    onPointerCancel: stop,
    onPointerLeave: stop,

    // The finger comes up on whatever it was held over, which on a row is the
    // link: without this the chore opens over the menu that just appeared.
    onClickCapture(event) {
      if (!held.current) return;

      held.current = false;
      event.preventDefault();
      event.stopPropagation();
    },

    // Android raises its own menu on a held finger, over ours. A mouse keeps
    // the browser's, which is the only thing a right click there means.
    onContextMenu(event) {
      if (held.current || timer.current) event.preventDefault();
    },
  };
}
