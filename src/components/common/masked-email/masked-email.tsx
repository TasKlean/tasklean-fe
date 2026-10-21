/**
 * The address, hidden until asked for. A mouse reveals it by hovering, with a
 * border drawing itself around the element to show the wait; everything else
 * reveals it on a press, since hover is a thing only a mouse has.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { type Box, ringHalves } from "@/components/common/masked-email/ring-halves";

type MaskedEmailProps = {
  email: string;
  className?: string;
};

// Matches `--animate-hold` in globals.css: the ring closing and the address
// appearing are two clocks, and they have to be set to the same time.
const HOLD_MS = 1500;

// Long enough to read as an address, short enough not to publish its length.
const MASK_LENGTH = 12;

// Enough to recognise which address it is, not enough to hand it to someone
// reading over a shoulder.
const VISIBLE_CHARS = 3;

const STROKE =
  "stroke-primary motion-safe:animate-hold fill-none stroke-2 [stroke-dasharray:1] [stroke-dashoffset:0] motion-safe:[stroke-dashoffset:1]";

/** Renders an address behind a mask that a deliberate gesture lifts. */
export function MaskedEmail({ email, className }: Readonly<MaskedEmailProps>) {
  const [revealed, setRevealed] = useState(false);
  const [holding, setHolding] = useState(false);
  const [box, setBox] = useState<Box | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const button = useRef<HTMLButtonElement>(null);

  function stopHolding() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }

  useEffect(() => stopHolding, []);

  useEffect(() => {
    const node = button.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      const size = entry?.borderBoxSize?.[0];
      if (!size) return;
      // Read rather than repeat `rounded-md`, so the ring cannot drift from the
      // radius token the button actually has.
      const radius = Number.parseFloat(getComputedStyle(node).borderTopLeftRadius);
      setBox({
        width: size.inlineSize,
        height: size.blockSize,
        radius: Number.isFinite(radius) ? radius : 0,
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function onPointerEnter(event: React.PointerEvent) {
    // Hover is a mouse gesture: a touch "enter" fires on tap and would reveal
    // after a hold nobody asked for.
    if (event.pointerType !== "mouse" || revealed) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      setRevealed(true);
      setHolding(false);
    }, HOLD_MS);
  }

  function onPointerLeave() {
    stopHolding();
    setRevealed(false);
  }

  return (
    <button
      ref={button}
      type="button"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={() => {
        stopHolding();
        setRevealed((shown) => !shown);
      }}
      onBlur={() => {
        stopHolding();
        setRevealed(false);
      }}
      className={`text-body-md text-muted-foreground hover:text-foreground gap-space-xs px-space-xs relative inline-flex min-h-8 w-fit items-center rounded-md transition-colors pointer-coarse:min-h-11 ${className ?? ""}`}
    >
      {revealed ? (
        <>
          <span className="break-all">{email}</span>
          <span className="sr-only">. Hide email address</span>
          <EyeOff className="size-4 shrink-0" aria-hidden />
        </>
      ) : (
        <>
          <span aria-hidden>
            {email.slice(0, VISIBLE_CHARS)}
            <span className="tracking-widest">{"•".repeat(MASK_LENGTH)}</span>
          </span>
          <span className="sr-only">Email address hidden. Show email address</span>
          <Eye className="size-4 shrink-0" aria-hidden />
        </>
      )}

      {holding && box ? (
        // overflow-visible so the stroke, which straddles the edge, is not
        // clipped in half by the svg's own box.
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        >
          {ringHalves(box).map((half) => (
            <path key={half} d={half} pathLength={1} className={STROKE} />
          ))}
        </svg>
      ) : null}
    </button>
  );
}
