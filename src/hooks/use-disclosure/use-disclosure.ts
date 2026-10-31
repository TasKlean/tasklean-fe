/**
 * The open and closed state a popup needs, with the two ways out: a press
 * outside it, and Escape, which hands focus back so a keyboard can leave.
 * The refs are concrete rather than generic, because both callers are a
 * relative wrapper holding a button.
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export type Disclosure = {
  open: boolean;
  toggle: () => void;
  close: () => void;
  root: RefObject<HTMLDivElement | null>;
  trigger: RefObject<HTMLButtonElement | null>;
};

/**
 * Runs a popup's open state and the listeners that close it.
 *
 * @returns The state, the two things a trigger does with it, and the refs to
 * put on the wrapper and the button.
 */
export function useDisclosure(): Disclosure {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      // Sending focus back is what makes Escape usable without a mouse.
      trigger.current?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = useCallback(() => setOpen((wasOpen) => !wasOpen), []);
  const close = useCallback(() => setOpen(false), []);

  return { open, toggle, close, root, trigger };
}
