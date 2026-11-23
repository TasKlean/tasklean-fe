/**
 * A row of choices that scrolls sideways, for an axis there could be twenty of.
 *
 * The scrollbar is a 6px target at the foot of a panel, so the strip also takes
 * the wheel and a drag. A real drag must not tick the pill it started on, which
 * is what the few pixels of slack and the swallowed click are for.
 */

"use client";

import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useRef,
} from "react";

type StripProps = {
  // The panel's own id for this field's body, which its legend points at.
  id: string;
  className: string;
  children: ReactNode;
};

// Enough slack that a press with a twitch in it still counts as a press.
const SLACK = 5;

/** Renders the scrolling row, and the two ways to move it by hand. */
export function Strip({ id, className, children }: Readonly<StripProps>) {
  const box = useRef<HTMLDivElement>(null);
  const from = useRef<{ x: number; left: number } | null>(null);
  const dragged = useRef(false);

  // A listener of our own, because React's `onWheel` is passive: it cannot
  // cancel the panel scrolling vertically at the same time.
  useEffect(() => {
    const strip = box.current;
    if (!strip) return;

    function onWheel(event: WheelEvent) {
      if (!strip) return;

      // A trackpad already sends sideways deltas, which the browser applies.
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      const max = strip.scrollWidth - strip.clientWidth;
      const at = strip.scrollLeft;

      // Nothing left this way, so the wheel goes back to scrolling the panel.
      if (max <= 0) return;
      if (event.deltaY < 0 && at <= 0) return;
      if (event.deltaY > 0 && at >= max) return;

      event.preventDefault();
      strip.scrollLeft = at + event.deltaY;
    }

    strip.addEventListener("wheel", onWheel, { passive: false });
    return () => strip.removeEventListener("wheel", onWheel);
  }, []);

  /** Starts a drag, for a mouse only: a finger already drags the strip. */
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;

    from.current = { x: event.clientX, left: box.current?.scrollLeft ?? 0 };
    dragged.current = false;
  }

  /** Pulls the strip along, once the press has moved enough to mean it. */
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = from.current;
    if (!start || !box.current) return;

    const moved = start.x - event.clientX;
    if (!dragged.current && Math.abs(moved) < SLACK) return;

    dragged.current = true;
    box.current.scrollLeft = start.left + moved;
  }

  /** Ends the drag, leaving the click that follows to find out about it. */
  function onPointerUp() {
    from.current = null;
  }

  /**
   * Swallows the click a drag ends with, so the strip moves without the pill
   * under the cursor being picked. Capture, because that is the one phase that
   * runs before a label hands the press to the input inside it.
   */
  function onClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    if (!dragged.current) return;

    event.preventDefault();
    event.stopPropagation();
    dragged.current = false;
  }

  return (
    <div
      ref={box}
      id={id}
      className={className}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      onClickCapture={onClickCapture}
    >
      {children}
    </div>
  );
}
