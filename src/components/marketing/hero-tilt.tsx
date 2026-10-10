/**
 * Leans the hero photo and its task card toward the cursor. Owns the overlap
 * layout too, because the tilt and the stacking are one visual unit: the card
 * drifts against the rotation, which is what makes it read as floating above
 * the photo rather than printed on it.
 */

"use client";

import { useEffect, useRef } from "react";
import type { PointerEvent, ReactNode } from "react";

type HeroTiltProps = {
  photo: ReactNode;
  card: ReactNode;
};

// Degrees at the far edge, then the pixels the card drifts against them.
// Deliberately small: the stage notices the cursor, it does not follow it.
const MAX_TILT = 5;
const CARD_DRIFT = 10;

/** Renders the hero photo with the task card floating over it, both cursor-aware. */
export function HeroTilt({ photo, card }: HeroTiltProps) {
  const stage = useRef<HTMLDivElement>(null);
  const floater = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  /** Writes the transforms on the next frame, from offsets in the range -0.5 to 0.5. */
  function lean(x: number, y: number) {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      if (stage.current) {
        stage.current.style.transform = `rotateX(${(-y * MAX_TILT).toFixed(2)}deg) rotateY(${(x * MAX_TILT).toFixed(2)}deg)`;
      }
      if (floater.current) {
        floater.current.style.transform = `translate3d(${(x * CARD_DRIFT).toFixed(1)}px, ${(y * CARD_DRIFT).toFixed(1)}px, 0)`;
      }
    });
  }

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    // Touch has no hover, and a reduced-motion request outranks the effect.
    if (event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = event.currentTarget.getBoundingClientRect();
    lean(
      (event.clientX - rect.left) / rect.width - 0.5,
      (event.clientY - rect.top) / rect.height - 0.5,
    );
  }

  function handleLeave() {
    lean(0, 0);
  }

  return (
    <div
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="mt-space-2xl mx-auto max-w-4xl perspective-distant"
    >
      <div
        ref={stage}
        className="transition-transform duration-500 ease-out will-change-transform transform-3d"
      >
        {photo}

        <div
          ref={floater}
          className="-mt-space-2xl px-space-sm sm:px-space-lg relative transition-transform duration-500 ease-out sm:-mt-28 sm:max-w-md lg:-mt-48 lg:max-w-lg"
        >
          {card}
        </div>
      </div>
    </div>
  );
}
